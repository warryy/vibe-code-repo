"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export function ChatHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 监听路径变化，刷新对话列表（以便显示新生成的标题）
  useEffect(() => {
    fetchConversations();
  }, [pathname]);

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: null }),
      });
      const data = await response.json();
      // 如果当前在 vibecoding 页面，跳转到 vibecoding，否则跳转到普通对话
      if (pathname?.startsWith("/vibecoding")) {
        router.push(`/vibecoding/${data.conversation.id}`);
      } else {
        router.push(`/chat/${data.conversation.id}`);
      }
      router.refresh();
      fetchConversations();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发父元素的点击事件

    if (!confirm("确定要删除这个对话吗？此操作不可撤销。")) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      // 如果删除的是当前正在查看的对话，跳转到首页
      const isCurrentConversation =
        pathname === `/chat/${conversationId}` ||
        pathname === `/vibecoding/${conversationId}`;

      if (isCurrentConversation) {
        router.push("/chat");
      }

      // 刷新对话列表
      fetchConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      alert("删除失败，请重试");
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-400 text-sm">加载中...</div>;
  }

  return (
    <div className="p-4">
      {/* <Button
        variant="primary"
        size="sm"
        className="w-full mb-4"
        onClick={handleNewChat}
      >
        + 新建对话
      </Button> */}

      <div className="space-y-1">
        {conversations.map((conv) => {
          const isChatActive = pathname === `/chat/${conv.id}`;
          const isVibeCodingActive = pathname === `/vibecoding/${conv.id}`;
          const isActive = isChatActive || isVibeCodingActive;
          const title = conv.title || "新对话";

          return (
            <div
              key={conv.id}
              className={`
                group relative flex items-center rounded-lg text-sm transition-colors
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }
              `}
            >
              <button
                onClick={() => {
                  // 如果当前在 vibecoding 页面，点击对话时跳转到 vibecoding
                  // 否则跳转到普通对话页面
                  router.push(`/vibecoding/${conv.id}`);

                  router.refresh();
                }}
                className="flex-1 text-left px-3 py-2"
              >
                <div className="truncate pr-6">{title}</div>
              </button>
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                className={`
                  absolute right-2 px-2 py-1 rounded opacity-0 group-hover:opacity-100
                  transition-opacity text-red-400 hover:text-red-300 hover:bg-red-900/20
                  ${isActive ? "text-red-200 hover:text-red-100" : ""}
                `}
                title="删除对话"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
