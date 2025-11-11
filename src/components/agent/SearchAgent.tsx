"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, SendHorizonal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
}

const FAQ_PRESETS = [
  "มีงานอะไรบ้าง?",
  "แสเงงานที่อยู่ในสถานะกำลังทำหรือ in progress",
  "มีงานของแผนก${currentUser.department}ไหม?",
  "งานไหนที่มี${currentUSer.name}อยู่ในงานนั้น?",
];

const SearchAI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const GEMINI_URL = process.env.NEXT_PUBLIC_AI_KEY;

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      // Ensure the endpoint is available at runtime and narrow the type to string
      const url = GEMINI_URL;
      if (!url) {
        throw new Error("Missing NEXT_PUBLIC_AI_KEY environment variable");
      }

      const payload = { question };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      setIsTyping(false);
      const firstKey = Object.keys(data)[0];
      const fullText =
        data[firstKey]?.[0]?.output || "ไม่มีข้อความตอบกลับจาก AI";

      const newAiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: "",
      };
      setMessages((prev) => [...prev, newAiMessage]);

      let i = 0;
      const interval = setInterval(() => {
        i++;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newAiMessage.id
              ? { ...msg, text: fullText.slice(0, i) }
              : msg
          )
        );
        if (i >= fullText.length) clearInterval(interval);
      }, 20);
    },
    onError: (error) => {
      setIsTyping(false);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: `เกิดข้อผิดพลาด: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: FormEvent, question?: string) => {
    e.preventDefault();
    const textToSend = question || input;
    if (!textToSend.trim() || mutation.isPending) return;

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsTyping(true);
    mutation.mutate(textToSend);
    setInput("");
  };

  // ✅ กดการ์ด preset แล้วส่งคำถามทันที
  const handlePresetClick = (question: string) => {
    const fakeEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(fakeEvent, question);
  };

  return (
    <div className="flex flex-col h-[90vh] mx-auto max-w-full p-4 antialiased">
      {/* ✅ กล่องข้อความแชท */}
      <div className="flex-grow overflow-y-auto space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot size={40} className="mb-2" />
              <p>เริ่มการสนทนาได้เลย!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-[70%] px-3 py-2 rounded-2xl",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  )}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <Card className="p-2">
              <AITextLoading />
            </Card>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ✅ ช่องพิมพ์ข้อความ */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t pt-2"
      >
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความที่นี่..."
          className="flex-1 px-4 py-4 rounded-md transition-all text-sm md:text-base"
          disabled={mutation.isPending}
        />
        <Button
          type="submit"
          className="p-4 rounded-md shadow-lg transition-colors disabled:bg-blue-300"
          disabled={mutation.isPending}
        >
          <SendHorizonal size={20} />
        </Button>
      </form>

      {messages.length === 0 && (
        <div className="mt-4 border-t pt-3">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            คำถามที่มีคนถามบ่อย
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {FAQ_PRESETS.map((q, idx) => (
              <Card
                key={idx}
                onClick={() => handlePresetClick(q)}
                className="cursor-pointer hover:bg-muted transition-all p-2"
              >
                <CardContent className="p-2 text-sm text-center">
                  {q}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAI;

interface AITextLoadingProps {
  texts?: string[];
  className?: string;
  interval?: number;
}

function AITextLoading({
  texts = [
    "Thinking...",
    "Processing...",
    "Analyzing...",
    "Computing...",
    "Almost...",
  ],
  className,
  interval = 1500,
}: AITextLoadingProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, texts.length]);

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="relative text-sm w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTextIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: ["200% center", "-200% center"],
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              backgroundPosition: {
                duration: 2.5,
                ease: "linear",
                repeat: Infinity,
              },
            }}
            className={cn(
              "flex justify-center text-sm font-bold bg-gradient-to-r from-neutral-950 via-neutral-400 to-neutral-950 dark:from-white dark:via-neutral-600 dark:to-white bg-[length:200%_100%] bg-clip-text text-transparent whitespace-nowrap min-w-max",
              className
            )}
          >
            {texts[currentTextIndex]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
