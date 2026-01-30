"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";

export type ChatMode = "stream" | "vibecoding";

interface ChatInputProps {
  onSend: (content: string, mode: ChatMode) => void;
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
}

export function ChatInput({
  onSend,
  mode = "vibecoding",
  onModeChange,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>(mode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleModeChange = (newMode: ChatMode) => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
  };

  // 自动调整 textarea 高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = "auto";
    // 设置新高度，但不超过最大高度（约 192px，即 max-h-48）
    const maxHeight = 384; // 对应 max-h-96 (24rem = 384px)
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // 如果内容超过最大高度，显示滚动条
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  };

  // 当输入内容变化时，调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput("");
    setLoading(true);

    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await onSend(content, currentMode);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="space-y-2">
      {/* Tab 按钮 */}
      {/* <div className="flex gap-2">
        <button
          onClick={() => handleModeChange("vibecoding")}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${
              currentMode === "vibecoding"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }
          `}
        >
          VibeCode
        </button>
        <button
          onClick={() => handleModeChange("stream")}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${
              currentMode === "stream"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }
          `}
        >
          流式对话
        </button>
      </div> */}

      {/* 输入框和发送按钮 */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            currentMode === "vibecoding"
              ? "输入代码需求... (Shift+Enter 换行)"
              : "输入消息... (Shift+Enter 换行)"
          }
          className="
            flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
            text-white placeholder-gray-500 resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            min-h-[44px] max-h-96 overflow-y-auto
          "
          rows={1}
          disabled={loading}
          style={{ height: "auto" }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="
            px-6 py-2 bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {loading ? "发送中..." : "发送"}
        </button>
      </div>
    </div>
  );
}
