"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, LockKeyhole, MailIcon, Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "password">("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleNext = (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (step === "email" && isEmailValid) {
            setStep("password");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
                toast.error("เข้าสู่ระบบไม่สำเร็จ", {
                    description: "โปรดตรวจสอบอีเมลและรหัสผ่านของคุณ"
                });
            } else {
                toast.success("เข้าสู่ระบบสำเร็จ");
                router.refresh(); // Refresh session
                router.push("/"); // Let middleware handle role-based redirect from root
            }
        } catch (error) {
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md p-8 space-y-6"
            >
                <form
                    onSubmit={step === "email" ? handleNext : handleSubmit}
                    className="space-y-6"
                >
                    {/* Logo Section */}
                    <div className="w-full grid place-content-center">
                        <div className="flex items-center gap-3 justify-center">
                            <img
                                src="/Logo_Stella_6.png"
                                alt="Logo"
                                className="h-50 w-50 object-contain"
                            />
                        </div>
                    </div>

                    <div className="text-black text-center space-y-2">
                        <p className="text-4xl font-bold">Welcome Back!</p>
                        <p className="text-neutral-400">Please sign in to your account</p>
                    </div>

                    <hr className="border-0.5 border-neutral-200" />

                    {/* Email Field - Step 1 */}
                    {step === "email" && (
                        <motion.div
                            key="email-field"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <label className="block text-sm font-medium ml-3 text-gray-700">
                                Email address
                            </label>
                            <div className="flex items-center gap-2 w-full text-gray-700 bg-gray-100 border border-gray-300 rounded-full overflow-clip">
                                <MailIcon size={20} className="text-neutral-400 ml-4" />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full py-2 text-gray-700 bg-gray-100 outline-none"
                                    placeholder="name@example.com"
                                    autoFocus
                                />
                                {isEmailValid && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        type="submit"
                                        className="w-11 h-9 grid place-content-center font-semibold text-white bg-black rounded-full hover:bg-neutral-800 cursor-pointer mr-1"
                                    >
                                        <ArrowRight size={22} />
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Password Field - Step 2 */}
                    {step === "password" && (
                        <motion.div
                            key="password-field"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 px-4 rounded-full w-fit mx-auto cursor-pointer border border-gray-200" onClick={() => setStep("email")}>
                                <span className="text-sm text-gray-600">{email}</span>
                                <span className="text-xs text-blue-500 font-medium hover:underline">Change</span>
                            </div>

                            <div className="relative flex items-center text-gray-700 bg-gray-100 border border-gray-300 rounded-full overflow-clip px-4">
                                <LockKeyhole size={20} className="text-neutral-400" />
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 outline-none"
                                    placeholder="Enter your password"
                                    autoFocus
                                />
                                <span onClick={() => setPasswordVisible(!passwordVisible)} className="cursor-pointer text-neutral-400">
                                    {passwordVisible ? <Eye size={18} /> : <EyeClosed size={18} />}
                                </span>
                            </div>

                            <div className="flex justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-gray-600 hover:text-black hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {error && (
                                <p className="text-sm text-center text-red-500">{error}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 font-semibold text-white shadow-white bg-black rounded-full hover:bg-neutral-800 disabled:bg-gray-400 cursor-pointer"
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                        </motion.div>
                    )}

                    {/* Sign Up Link */}
                    <div className="text-center text-sm text-gray-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-semibold text-black hover:underline">
                            Sign Up
                        </Link>
                    </div>

                    {/* Demo Accounts Hint */}
                    <div className="mt-8 pt-4 border-t border-dashed border-gray-200">
                        <p className="text-xs text-center text-gray-400 mb-2">Demo Accounts</p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                            <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100">Admin: admin@techjob.com / 123456</span>
                            <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100">User: employee@techjob.com / 123456</span>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
