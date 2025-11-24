"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send, Sparkles, User as UserIcon, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/features/userStore";

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const SearchAI = () => {
  const { currentUser } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const N8N_AI_URL = process.env.NEXT_PUBLIC_N8N_AI_URL;

  // Updated FAQs with dynamic content where possible
  const FAQ_PRESETS = [
    "สรุปภาพรวมงานทั้งหมดให้หน่อย",
    "มีงานอะไรที่ยังค้างอยู่บ้าง (Pending/In Progress)?",
    `งานของแผนก ${currentUser?.department || "ฉัน"} มีอะไรบ้าง?`,
    "ช่วยวิเคราะห์การใช้วัสดุอุปกรณ์ให้หน่อย",
  ];

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      const payload = { answer: question };
      const res = await fetch(N8N_AI_URL as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const raw = await res.text();
      
      if (!raw || raw.trim() === "") {
        throw new Error("Response body is empty");
      }

      try {
        return JSON.parse(raw);
      } catch (error) {
        throw new Error("Response is not JSON: " + raw);
      }
    },

    onSuccess: (data) => {
      setIsTyping(false);

      let fullText = "ขออภัย ฉันไม่สามารถประมวลผลคำตอบได้ในขณะนี้";

      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          const firstItem = data[firstKey][0];
          if (firstItem && firstItem.output) {
            fullText = firstItem.output;
          } else if (firstKey) {
            fullText = firstKey;
          }
        } else if (data.answer) {
          fullText = data.answer;
        } else if (data.output) {
          fullText = data.output;
        } else if (data.result) {
          fullText = data.result;
        } else if (data.text) {
          fullText = data.text;
        }
      }

      const newAiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: "",
        timestamp: new Date(),
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
      }, 10); // Faster typing speed
    },

    onError: (error) => {
      setIsTyping(false);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: `เกิดข้อผิดพลาด: ${error.message}`,
        timestamp: new Date(),
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
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsTyping(true);
    mutation.mutate(textToSend);
    setInput("");
  };

  const handlePresetClick = (question: string) => {
    const fakeEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(fakeEvent, question);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[93vh] w-full bg-background/50 backdrop-blur-sm rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask me anything about jobs & inventory</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={handleClearChat} title="Clear Chat">
            <RefreshCcw className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6 mt-10"
            >
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-2 ring-8 ring-primary/5">
                <Bot size={40} className="text-primary" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">สวัสดีครับ, {currentUser?.name || "User"}! 👋</h3>
                <p className="text-muted-foreground">
                  ผมคือ AI Assistant ที่พร้อมช่วยคุณค้นหาข้อมูลงาน, สถานะโปรเจกต์, หรือข้อมูลคลังสินค้า
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                {FAQ_PRESETS.map((q, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePresetClick(q)}
                    className="text-left p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-md group"
                  >
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{q}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <Avatar className="w-8 h-8 mt-1 border shadow-sm">
                  {msg.sender === "user" ? (
                    <>
                      <AvatarImage src={currentUser?.imageUrl} />
                      <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarFallback className="bg-primary/10"><Bot className="w-4 h-4 text-primary" /></AvatarFallback>
                    </> 
                  )}
                </Avatar>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap",
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-primary to-blue-600 text-primary-foreground rounded-tr-none"
                        : "bg-white dark:bg-muted border text-foreground rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Avatar className="w-8 h-8 mt-1 border shadow-sm">
              <AvatarFallback className="bg-primary/10"><Bot className="w-4 h-4 text-primary" /></AvatarFallback>
            </Avatar>
            <div className="bg-muted/50 border px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 h-[46px]">
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t">
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความของคุณที่นี่..."
            className="pr-12 py-6 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20 bg-background/50"
            disabled={mutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon"
            className="absolute right-1.5 w-9 h-9 rounded-full shadow-md transition-all hover:scale-105" 
            disabled={!input.trim() || mutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchAI;
