"use client"; // This is a Next.js specific directive for client-side components

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useMutation, QueryClient,  } from '@tanstack/react-query';
import { SendHorizonal } from 'lucide-react'; // Icon library for React

// สร้าง client สำหรับ Tanstack Query
const queryClient = new QueryClient();

// ข้อมูลสำหรับข้อความในแชท
interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

// สร้างคอมโพเนนต์หลักของแอปพลิเคชัน
const SearchAI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // สถานะสำหรับเก็บข้อความที่ผู้ใช้พิมพ์
  const [input, setInput] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const API_URL = 'http://localhost:8000/search_ai';

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      const payload = { question: question };
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // ตรวจสอบว่าการเรียก API สำเร็จหรือไม่
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // แปลง response ที่ได้เป็น JSON และคืนค่า
      const data = await response.json();
      return data;
    },
    onSuccess: (data : any) => {
      const newAiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.response,
      };
      setMessages((prevMessages) => [...prevMessages, newAiMessage]);
    },
    onError: (error : any) => {
      // หากเกิดข้อผิดพลาด ให้เพิ่มข้อความแสดงข้อผิดพลาดจาก AI
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `เกิดข้อผิดพลาด: ${error.message}`,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    },
  });

  // useEffect สำหรับเลื่อนหน้าจอไปยังข้อความล่าสุดเมื่อมีการเพิ่มข้อความใหม่
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ฟังก์ชันสำหรับจัดการการส่งฟอร์ม
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault(); // ป้องกันการรีโหลดหน้าจอ
    if (input.trim() === '' || mutation.isPending) return;

    // เพิ่มข้อความของผู้ใช้ลงในประวัติการแชท
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // เรียกใช้ mutation เพื่อส่งข้อความไปยัง API
    mutation.mutate(input);

    // ล้างช่อง input
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto bg-gray-50 text-gray-800 antialiased font-sans">
      <div className="flex-grow p-6 overflow-y-auto space-y-4">
        {/* ส่วนแสดงข้อความแชท */}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>เริ่มการสนทนาได้เลย!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl shadow-md ${msg.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-900 rounded-bl-none'
                  }`}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        {/* ส่วนแสดงสถานะกำลังโหลด */}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-md">
              <span className="animate-pulse text-gray-500">กำลังพิมพ์...</span>
            </div>
          </div>
        )}
        {/* ส่วนอ้างอิงสำหรับเลื่อนหน้าจอ */}
        <div ref={chatEndRef} />
      </div>

      {/* ส่วนฟอร์มสำหรับพิมพ์ข้อความ */}
      <div className="p-4 bg-gray-100 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความที่นี่..."
            className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base"
            disabled={mutation.isPending}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors disabled:bg-blue-300"
            disabled={mutation.isPending}
          >
            <SendHorizonal size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SearchAI;
