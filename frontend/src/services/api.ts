import { createDefaultWorkflowSteps } from "@/lib/constants";
import type { ChatRequestPayload, ChatResponse } from "@/types";

const API_TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;

type RequestOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, options: RequestOptions = {}) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (options.retries ?? MAX_RETRIES); attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? API_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${getBaseUrl()}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as T;
      clearTimeout(timeout);
      return data;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error : new Error("Unknown request error");

      if (attempt === (options.retries ?? MAX_RETRIES)) {
        throw lastError;
      }

      await wait(400 * (attempt + 1));
    }
  }

  throw lastError ?? new Error("Unknown request error");
}

export async function postChatMessage(
  payload: ChatRequestPayload,
): Promise<ChatResponse> {
  const response = await request<Partial<ChatResponse> & { response?: string }>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    message: response.message ?? response.response ?? "",
    workflow: response.workflow ?? createDefaultWorkflowSteps(),
    taskCompleted: Boolean(response.taskCompleted ?? true),
    memoryHints: Array.isArray(response.memoryHints) ? response.memoryHints : [],
  };
}
