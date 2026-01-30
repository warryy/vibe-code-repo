"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChatHistory } from "./ChatHistory";
import { Button } from "@/components/ui/Button";

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white mb-2">Vibe Coding</h1>
        {session?.user && (
          <p className="text-sm text-gray-400 truncate">{session.user.email}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {(pathname?.startsWith("/chat") ||
          pathname?.startsWith("/vibecoding")) && <ChatHistory />}
      </div>

      <div className="p-4 border-t border-gray-700">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          退出登录
        </Button>
      </div>
    </div>
  );
}
