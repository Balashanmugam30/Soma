import type { ChatRequestPayload, ChatResponse } from "@/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: "timeout" | "network" | "server" | "unknown",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getBaseUrl() {
  return "";
}

function mapVoiceLanguage(language: "en" | "ta" | "hi") {
  const languageMap = {
    en: "en-IN",
    ta: "ta-IN",
    hi: "hi-IN",
  } as const;

  return languageMap[language] ?? "en-IN";
}

export async function postChatMessage(
  payload: ChatRequestPayload,
): Promise<ChatResponse> {
  const requestBody = payload;

  console.log("API CALL START", {
    url: `${getBaseUrl()}/chat`,
    body: requestBody,
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  let response: Response;

  try {
    response = await fetch(`${getBaseUrl()}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (error) {
    window.clearTimeout(timeoutId);
    console.error("ERROR OCCURRED", error);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out", "timeout");
    }

    throw new ApiError("Network failure", "network");
  }

  window.clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("ERROR OCCURRED", {
      status: response.status,
      body: errorText,
    });
    throw new ApiError(
      errorText || `Request failed with status ${response.status}`,
      "server",
      response.status,
    );
  }

  let data: { response?: string; steps?: string[]; message?: string; data?: { response?: string; steps?: string[] } };

  try {
    data = (await response.json()) as {
      response?: string;
      steps?: string[];
      message?: string;
      data?: { response?: string; steps?: string[] };
    };
  } catch (error) {
    console.error("ERROR OCCURRED", error);
    throw new ApiError("Invalid JSON response from backend.", "unknown");
  }

  console.log("API RESPONSE RECEIVED", data);

  const responseText =
    data.response ??
    data.message ??
    data.data?.response ??
    "No response from server";
  return {
    message: responseText,
    response: responseText,
    workflow: [],
    steps: [],
    taskCompleted: true,
    memoryHints: [],
  };
}

export async function postSpeechToText(audioBlob: Blob, language: "en" | "ta" | "hi") {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  const response = await fetch(
    `${getBaseUrl()}/speech-to-text?language=${encodeURIComponent(mapVoiceLanguage(language))}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new ApiError(errorText || "Speech-to-text request failed.", "server", response.status);
  }

  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
}

export async function postTextToSpeech(text: string, language: "en" | "ta" | "hi") {
  const response = await fetch(`${getBaseUrl()}/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      language: mapVoiceLanguage(language),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new ApiError(errorText || "Text-to-speech request failed.", "server", response.status);
  }

  const data = (await response.json()) as { audio?: string };
  return data.audio ?? "";
}
