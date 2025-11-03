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

const SearchAI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const API_URL = "https://muping.app.n8n.cloud/webhook/agent";

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      const payload = { question };
      const res = await fetch(API_URL, {
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

      // Typing effect
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || mutation.isPending) return;

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: input,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsTyping(true);
    mutation.mutate(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[86vh] mx-auto max-w-full p-4 bg-background border rounded-2xl shadow-lg antialiased">
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

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
    </div>
  )
};

export default SearchAI;

// ---------------------------------------------------------------

interface AITextLoadingProps {
  texts?: string[];
  className?: string;
  interval?: number;
}

function AITextLoading({
  texts = ["Thinking...", "Processing...", "Analyzing...", "Computing...", "Almost..."],
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
  )
}
