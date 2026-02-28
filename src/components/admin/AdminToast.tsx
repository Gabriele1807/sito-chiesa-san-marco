"use client";

import { useState, useEffect, useCallback } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error";
}

let toastId = 0;
const listeners: Set<(msg: ToastMessage) => void> = new Set();

export function showToast(text: string, type: "success" | "error" = "success") {
  const msg: ToastMessage = { id: ++toastId, text, type };
  listeners.forEach((fn) => fn(msg));
}

export default function AdminToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addMessage = useCallback((msg: ToastMessage) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    }, 3000);
  }, []);

  useEffect(() => {
    listeners.add(addMessage);
    return () => { listeners.delete(addMessage); };
  }, [addMessage]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-[fadeInUp_0.3s_ease] ${
            msg.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {msg.type === "success" ? "✓ " : "✗ "}
          {msg.text}
        </div>
      ))}
    </div>
  );
}
