"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput, ChatMode } from "@/components/chat/ChatInput";
import { VibeCodingFileTree } from "./VibeCodingFileTree";
import { VibeCodingEditor } from "./VibeCodingEditor";
import { VibeCodingPreview } from "./VibeCodingPreview";
import { GeneratingIndicator } from "./GeneratingIndicator";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false },
);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface CodeFile {
  path: string;
  content: string;
  language?: string;
}

interface VibeCodingViewProps {
  conversationId: string;
}

export function VibeCodingView({ conversationId }: VibeCodingViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");

  // 加载对话消息和代码
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载消息
        const messagesResponse = await fetch(
          `/api/conversations/${conversationId}`,
        );
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);

        // 加载代码
        const codeResponse = await fetch(`/api/vibecoding/${conversationId}`);
        if (codeResponse.ok) {
          const codeData = await codeResponse.json();
          setCodeFiles(codeData.files || []);
          if (codeData.files && codeData.files.length > 0) {
            setActiveFile(codeData.files[0].path);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [conversationId]);

  // 如果没有代码且有消息，自动生成代码
  useEffect(() => {
    if (
      !loading &&
      codeFiles.length === 0 &&
      messages.length > 0 &&
      !generating
    ) {
      const firstUserMessage = messages.find((m) => m.role === "user");
      if (firstUserMessage) {
        // 使用流式生成
        generateCode(firstUserMessage.content);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, codeFiles.length, messages.length]);

  const generateCode = async (userRequest: string) => {
    setGenerating(true);
    setCodeFiles([]); // 清空现有文件

    try {
      const response = await fetch("/api/vibecoding/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          userRequest,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let buffer = "";
      let firstFile = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              console.log("代码生成完成");
              setGenerating(false);
              return;
            }

            try {
              const json = JSON.parse(data);

              if (json.type === "file" && json.file) {
                // 添加或更新文件
                setCodeFiles((prev) => {
                  const existing = prev.findIndex(
                    (f) => f.path === json.file.path,
                  );
                  if (existing >= 0) {
                    // 更新现有文件
                    const updated = [...prev];
                    updated[existing] = json.file;
                    return updated;
                  } else {
                    // 添加新文件
                    const newFiles = [...prev, json.file];
                    // 如果是第一个文件，自动选中
                    if (firstFile && newFiles.length === 1) {
                      setTimeout(() => setActiveFile(json.file.path), 0);
                      firstFile = false;
                    }
                    return newFiles;
                  }
                });
                console.log(
                  "✅ 收到文件:",
                  json.file.path,
                  `(${json.file.content?.length || 0} 字符)`,
                );
              } else if (json.type === "progress") {
                console.log("📝 生成进度:", json.data);
              } else if (json.type === "done") {
                console.log("✅ 生成完成，共", json.fileCount, "个文件");
                setGenerating(false);
                // 确保至少选中一个文件
                if (codeFiles.length === 0) {
                  // 如果还没有文件，等待一下
                  setTimeout(() => {
                    if (codeFiles.length > 0) {
                      setActiveFile(codeFiles[0].path);
                    }
                  }, 100);
                }
              } else if (json.type === "error") {
                console.error("❌ 生成错误:", json.error);
                alert(`代码生成失败: ${json.error}`);
                setGenerating(false);
                return;
              }
            } catch (e) {
              console.error("解析 SSE 数据失败:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
      alert("代码生成失败，请重试");
      setGenerating(false);
    }
  };

  const handleSendMessage = async (content: string, mode: ChatMode) => {
    try {
      // 保存用户消息
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();

      // 添加用户消息到列表
      const userMessage: Message = {
        id: data.message.id,
        role: "user",
        content,
        created_at: data.message.created_at,
      };
      setMessages((prev) => [...prev, userMessage]);

      // 如果是流式对话模式，跳转到对话页面
      if (mode === "stream") {
        window.location.href = `/chat/${conversationId}`;
        return;
      }

      // VibeCoding 模式：流式生成代码
      await generateCode(content);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCodeChange = async (path: string, content: string) => {
    // 更新本地状态
    setCodeFiles((prev) =>
      prev.map((file) => (file.path === path ? { ...file, content } : file)),
    );

    // 保存到数据库（防抖处理）
    try {
      await fetch(`/api/vibecoding/${conversationId}/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: path, content }),
      });
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  };

  const activeFileContent = codeFiles.find((f) => f.path === activeFile);

  // 查找 HTML 文件用于预览
  const htmlFile = useMemo(() => {
    console.log(
      "[VibeCodingView] 查找 HTML 文件，文件列表:",
      codeFiles.map((f) => f.path),
    );

    if (codeFiles.length === 0) {
      console.log("[VibeCodingView] 文件列表为空");
      return null;
    }

    const priorityNames = ["index.html", "main.html", "app.html"];

    // 1. 按优先级查找
    for (const name of priorityNames) {
      console.log("===codeFiles", codeFiles);
      const file = codeFiles.find((f) => {
        const normalizedPath = f.path.toLowerCase().trim();
        return (
          normalizedPath === name ||
          normalizedPath.endsWith(`/${name}`) ||
          normalizedPath.endsWith(`\\${name}`) ||
          normalizedPath === `./${name}` ||
          normalizedPath.includes(`/${name}`)
        );
      });
      if (file) {
        console.log(`[VibeCodingView] ✅ 找到优先级 HTML 文件: ${file.path}`);
        return file;
      }
    }

    // 2. 查找任何 HTML 文件（更宽松的匹配）
    const htmlFile = codeFiles.find((f) => {
      const path = f.path.toLowerCase().trim();
      const ext = path.split(".").pop();
      const hasHtmlExt = ext === "html" || ext === "htm";
      const containsHtml = path.includes(".html") || path.includes(".htm");
      return hasHtmlExt || containsHtml;
    });

    if (htmlFile) {
      console.log(`[VibeCodingView] ✅ 找到 HTML 文件: ${htmlFile.path}`);
    } else {
      console.log("[VibeCodingView] ❌ 未找到 HTML 文件");
      console.log(
        "[VibeCodingView] 所有文件详情:",
        codeFiles.map((f) => {
          const ext = f.path.split(".").pop();
          return {
            path: f.path,
            ext: ext?.toLowerCase(),
            language: f.language,
            hasHtml: f.path.toLowerCase().includes("html"),
          };
        }),
      );
    }

    return htmlFile || null;
  }, [codeFiles]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 relative">
      {/* 生成代码时的醒目提示 - 固定在顶部 */}
      {generating && (
        <>
          <GeneratingIndicator fileCount={codeFiles.length} />
          {/* 为固定定位的提示栏留出空间 */}
          <div className="h-[73px] flex-shrink-0"></div>
        </>
      )}
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：对话模块 */}
        <div className="w-[400px] h-full border-r border-gray-700 bg-gray-800 flex flex-col p-2">
          {/* 对话模块 */}
          <h3 className="font-medium text-gray-300 mb-2 p-2">当前对话</h3>
          <div className="flex-1 overflow-y-auto mb-3">
            <MessageList messages={messages} />
          </div>
          <ChatInput onSend={handleSendMessage} mode="vibecoding" />
        </div>
        <div className="size-full flex-1 flex flex-col">
          {/* 右侧顶部：返回按钮 + Tab 切换 */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div>
              <button onClick={() => router.back()} className="w-full">
                返回
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("code")}
                className={`
              px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${
                viewMode === "code"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }
            `}
              >
                💻 代码查看
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`
              px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${
                viewMode === "preview"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }
            `}
              >
                🌐 应用查看
              </button>
            </div>
          </div>
          {/* 右侧：内容区域 */}
          <div className="size-full flex-1">
            {viewMode === "preview" ? (
              <VibeCodingPreview
                files={codeFiles}
                htmlFile={htmlFile || null}
              />
            ) : (
              <div className="size-full flex-1 flex">
                {/* 右侧: 文件树 */}
                <div className="border-r border-gray-700">
                  <VibeCodingFileTree
                    files={codeFiles}
                    activeFile={activeFile}
                    onSelectFile={setActiveFile}
                    generating={generating}
                  />
                </div>
                <div className="size-full flex-1 flex flex-col overflow-hidden">
                  {/* 编辑器区域 */}
                  {activeFileContent ? (
                    <VibeCodingEditor
                      file={activeFileContent}
                      onChange={(content) =>
                        handleCodeChange(activeFileContent.path, content)
                      }
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      {codeFiles.length === 0
                        ? "发送消息开始生成代码"
                        : "选择一个文件查看代码"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
