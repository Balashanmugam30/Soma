"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn, formatDateLabel } from "@/lib/utils";
import type { AgentRuntime, Conversation, CustomAgent } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  agents: AgentRuntime[];
  selectedAgentId: string | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  customAgents: CustomAgent[];
  pinnedConversationIds: string[];
  pinnedCustomAgentIds: string[];
  selectedCustomAgentId: string | null;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onSelectAgent: (agentId: AgentRuntime["id"]) => void;
  onRenameAgent: (agent: AgentRuntime) => void;
  onPinAgent: (agentId: AgentRuntime["id"]) => void;
  onDeleteAgent: (agentId: AgentRuntime["id"]) => void;
  onRenameConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
  onPinConversation: (conversationId: string) => void;
  onCreateAgent: () => void;
  onSelectCustomAgent: (agentId: string) => void;
  onRenameCustomAgent: (agent: CustomAgent) => void;
  onPinCustomAgent: (agentId: string) => void;
  onDeleteCustomAgent: (agentId: string) => void;
}

interface ItemMenuProps {
  itemId: string;
  openMenuId: string | null;
  onToggleMenu: (itemId: string) => void;
  onRename?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
}

function ItemMenu({
  itemId,
  openMenuId,
  onToggleMenu,
  onRename,
  onPin,
  onDelete,
}: ItemMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu(itemId);
        }}
        className="p-1 opacity-60 transition-all duration-200 ease-in-out hover:opacity-100"
        aria-label="Open menu"
      >
        <MoreHorizontal size={16} />
      </button>

      {openMenuId === itemId ? (
        <div className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-white/10 bg-[var(--bg-secondary)] shadow-lg transition-all duration-200 ease-in-out">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRename?.();
            }}
            className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)]"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPin?.();
            }}
            className="w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)]"
          >
            Pin
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="w-full px-3 py-2 text-left text-red-400 hover:bg-[var(--bg-hover)]"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const Sidebar = memo(function Sidebar({
  isOpen,
  toggle,
  agents,
  selectedAgentId,
  conversations,
  activeConversationId,
  customAgents,
  pinnedConversationIds,
  pinnedCustomAgentIds,
  selectedCustomAgentId,
  onNewChat,
  onSelectConversation,
  onSelectAgent,
  onRenameAgent,
  onPinAgent,
  onDeleteAgent,
  onRenameConversation,
  onDeleteConversation,
  onPinConversation,
  onCreateAgent,
  onSelectCustomAgent,
  onRenameCustomAgent,
  onPinCustomAgent,
  onDeleteCustomAgent,
}: SidebarProps) {
  const { dictionary } = useLanguage();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const filteredChats = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [conversations, search],
  );

  const orderedChats = useMemo(() => {
    return [...filteredChats].sort((left, right) => {
      const leftPinned = pinnedConversationIds.includes(left.id);
      const rightPinned = pinnedConversationIds.includes(right.id);
      if (leftPinned === rightPinned) {
        return right.updatedAt.localeCompare(left.updatedAt);
      }
      return leftPinned ? -1 : 1;
    });
  }, [filteredChats, pinnedConversationIds]);

  const orderedCustomAgents = useMemo(() => {
    return [...(customAgents ?? [])].sort((left, right) => {
      const leftPinned = pinnedCustomAgentIds.includes(left.id);
      const rightPinned = pinnedCustomAgentIds.includes(right.id);
      if (leftPinned === rightPinned) {
        return right.createdAt.localeCompare(left.createdAt);
      }
      return leftPinned ? -1 : 1;
    });
  }, [customAgents, pinnedCustomAgentIds]);

  return (
    <div className="flex flex-col h-full text-[var(--text-main)]">
      <div className="flex items-center justify-between p-3">
        <div />
        <button
          type="button"
          onClick={toggle}
          className="p-2 text-[var(--text-main)] opacity-70 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100"
          aria-label={isOpen ? dictionary.labels.closeSidebar : dictionary.labels.openSidebar}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <div className="px-2 space-y-3">
        <button
          type="button"
          onClick={onNewChat}
          className={cn(
            "w-full rounded-xl bg-[var(--bg-main)] text-[var(--text-main)] opacity-70 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100",
            isOpen
              ? "inline-flex items-center justify-start gap-2 px-4 py-3 text-sm font-medium"
              : "inline-flex items-center justify-center px-0 py-3",
          )}
        >
          <PlusCircle size={16} />
          {isOpen ? dictionary.workspace.newChat : null}
        </button>

        {isOpen ? (
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none"
          />
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-scroll no-scrollbar px-2">
        <div className="my-3 border-t border-white/10" />

        <section>
          <div className={cn("flex items-center gap-2 px-3", !isOpen && "justify-center px-0")}>
            <Bot size={16} className="text-[var(--text-main)] opacity-60" />
            {isOpen ? (
              <p className="px-3 text-xs uppercase tracking-wide opacity-50">
                {dictionary.sidebar.agents}
              </p>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            {agents?.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "group w-full rounded-2xl text-[var(--text-main)] opacity-70 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100",
                  isOpen ? "px-4 py-3" : "flex justify-center px-0 py-3",
                  selectedAgentId === agent.id && "bg-[var(--bg-main)] opacity-100",
                )}
              >
                {isOpen ? (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectAgent(agent.id)}
                        className="min-w-0 flex-1 text-left"
                        aria-pressed={selectedAgentId === agent.id}
                      >
                      <div>
                        <p className="text-sm font-medium text-[var(--text-main)]">{agent.name}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-main)] opacity-55">
                          {agent.description}
                        </p>
                      </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full transition-all duration-200 ease-in-out",
                            selectedAgentId === agent.id
                              ? "bg-green-500 w-2 h-2 rounded-full"
                              : "bg-[var(--text-main)] opacity-20",
                          )}
                        />
                        <div className="relative opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100">
                          <ItemMenu
                            itemId={agent.id}
                            openMenuId={openMenuId}
                            onToggleMenu={(itemId) =>
                              setOpenMenuId(openMenuId === itemId ? null : itemId)
                            }
                            onRename={() => {
                              onRenameAgent(agent);
                              setOpenMenuId(null);
                            }}
                            onPin={() => {
                              onPinAgent(agent.id);
                              setOpenMenuId(null);
                            }}
                            onDelete={() => {
                              onDeleteAgent(agent.id);
                              setOpenMenuId(null);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                  <button
                    type="button"
                    onClick={() => onSelectAgent(agent.id)}
                    className="flex w-full justify-center"
                    aria-pressed={selectedAgentId === agent.id}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition-all duration-200 ease-in-out",
                        selectedAgentId === agent.id
                          ? "bg-green-500 w-2 h-2 rounded-full"
                          : "bg-[var(--text-main)] opacity-20",
                      )}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="my-3 border-t border-white/10" />

        <section>
          <div className={cn("flex items-center gap-2 px-3", !isOpen && "justify-center px-0")}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--text-main)] opacity-60" />
              {isOpen ? (
                <p className="px-3 text-xs uppercase tracking-wide opacity-50">
                  My Agent
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {isOpen ? (
              <button
                type="button"
                onClick={onCreateAgent}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--bg-main)] px-4 py-3 text-sm font-medium text-[var(--text-main)] opacity-75 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100"
              >
                <PlusCircle size={16} />
                Create Agent
              </button>
            ) : null}
            {orderedCustomAgents.length === 0 ? (
              <p className={cn("px-6 text-sm text-[var(--text-main)] opacity-45", !isOpen && "hidden")}>
                No custom agents yet
              </p>
            ) : (
              orderedCustomAgents?.map((agent) => (
                <div
                  key={agent.id}
                  className={cn(
                    "group w-full rounded-2xl text-[var(--text-main)] opacity-80 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100",
                    isOpen ? "px-4 py-3" : "flex justify-center px-0 py-3",
                    selectedCustomAgentId === agent.id && "bg-[var(--bg-main)] opacity-100",
                  )}
                >
                  {isOpen ? (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectCustomAgent(agent.id)}
                        className="min-w-0 flex-1 text-left"
                        aria-pressed={selectedCustomAgentId === agent.id}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{agent.name}</p>
                          <p className="mt-1 text-xs leading-5 opacity-55">{agent.description}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full transition-all duration-200 ease-in-out",
                            selectedCustomAgentId === agent.id
                              ? "bg-green-500 w-2 h-2 rounded-full"
                              : "bg-[var(--text-main)] opacity-20",
                          )}
                        />
                        <div className="relative opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100">
                          <ItemMenu
                            itemId={agent.id}
                            openMenuId={openMenuId}
                            onToggleMenu={(itemId) =>
                              setOpenMenuId(openMenuId === itemId ? null : itemId)
                            }
                            onRename={() => {
                              onRenameCustomAgent(agent);
                              setOpenMenuId(null);
                            }}
                            onPin={() => {
                              onPinCustomAgent(agent.id);
                              setOpenMenuId(null);
                            }}
                            onDelete={() => {
                              onDeleteCustomAgent(agent.id);
                              setOpenMenuId(null);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectCustomAgent(agent.id)}
                      className="flex w-full justify-center"
                      aria-pressed={selectedCustomAgentId === agent.id}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition-all duration-200 ease-in-out",
                          selectedCustomAgentId === agent.id
                            ? "bg-green-500 w-2 h-2 rounded-full"
                            : "bg-[var(--text-main)] opacity-20",
                        )}
                      />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <div className="my-3 border-t border-white/10" />

        <section>
          <div className={cn("flex items-center gap-2 px-3", !isOpen && "justify-center px-0")}>
            <BrainCircuit size={16} className="text-[var(--text-main)] opacity-60" />
            {isOpen ? (
              <p className="px-3 text-xs uppercase tracking-wide opacity-50">
                {dictionary.sidebar.conversations}
              </p>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            {orderedChats.length === 0 ? (
              <p className={cn("px-2 text-sm text-[var(--text-main)] opacity-45", !isOpen && "hidden")}>
                {search ? "No matching chats" : dictionary.workspace.startFirstConversation}
              </p>
            ) : (
              orderedChats.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative rounded-2xl text-[var(--text-main)] opacity-70 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100",
                    isOpen ? "px-3 py-2" : "px-0 py-3",
                    activeConversationId === conversation.id && "bg-[var(--bg-main)] opacity-100",
                  )}
                >
                  {isOpen ? (
                    <div className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--bg-hover)]">
                      <button
                        type="button"
                        onClick={() => onSelectConversation(conversation.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-medium">{conversation.title}</p>
                        <p className="mt-1 text-xs opacity-45">
                          {formatDateLabel(conversation.updatedAt)}
                        </p>
                      </button>
                      <div className="relative opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100">
                        <ItemMenu
                          itemId={conversation.id}
                          openMenuId={openMenuId}
                          onToggleMenu={(itemId) =>
                            setOpenMenuId(openMenuId === itemId ? null : itemId)
                          }
                          onRename={() => {
                            onRenameConversation(conversation);
                            setOpenMenuId(null);
                          }}
                          onPin={() => {
                            onPinConversation(conversation.id);
                            setOpenMenuId(null);
                          }}
                          onDelete={() => {
                            onDeleteConversation(conversation);
                            setOpenMenuId(null);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conversation.id)}
                      className="flex w-full justify-center"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--text-main)] opacity-25" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
});
