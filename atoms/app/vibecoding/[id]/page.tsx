"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VibeCodingView } from "@/components/vibecoding/VibeCodingView";

export default function VibeCodingPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 页面加载完成
    setLoading(false);
  }, [conversationId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">

      <main className="flex-1 overflow-hidden">
        <VibeCodingView conversationId={conversationId} />
      </main>
    </div>
  );
}
