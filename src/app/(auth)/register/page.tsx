
"use client";


import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Eye,
    EyeClosed,
    LockKeyhole,
    MailIcon,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();

    const [step, setStep] = useState<"name" | "email" | "password">("name");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password.length >= 6;
    const isPasswordsMatch = password === confirmPassword;

    const handleNext = (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (step === "name") {
            if (name.trim().length > 0) setStep("email");
        } else if (step === "email") {
            if (isEmailValid) setStep("password");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isPasswordValid) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (!isPasswordsMatch) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                toast.success("Registration successful! Please login.");
                router.push("/login");
            } else {
                const data = await res.json();
                setError(data.message || "Registration failed");
                toast.error(data.message || "Registration failed");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong");
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
                    onSubmit={step !== "password" ? handleNext : handleSubmit}
                    className="space-y-6"
                >
                    <div className="w-full grid place-content-center">
                        <div className="flex items-center gap-3 justify-center">
                            <img
                                src="/Logo_Stella_6.png"
                                alt="Logo"
                                className="h-50 w-50 object-contain "
                            />
                        </div>
                    </div>

                    <div className="text-black text-center space-y-2">
                        <p className="text-4xl font-bold">Create Account</p>
                        <p className="text-neutral-400">Join us to manage your work</p>
                    </div>

                    <hr className="border-0.5 border-neutral-200" />

                    {/* Name Field */}
                    {step === "name" && (
                        <motion.div
                            key="name-field"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <label className="block text-sm font-medium ml-3 text-gray-700">
                                Full Name
                            </label>
                            <div className="flex items-center gap-2 w-full text-gray-700 bg-gray-100 border border-gray-300 rounded-full overflow-clip">
                                <User size={20} className="text-neutral-400 ml-4" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full py-2 text-gray-700 bg-gray-100 outline-none"
                                    placeholder="Somchai Jaidee"
                                    autoFocus
                                />
                                {name.trim().length > 0 && (
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

                    {/* Email Field */}
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
                                    type="email"
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

                    {/* Password Field */}
                    {step === "password" && (
                        <motion.div
                            key="password-field"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block ml-3 text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative flex items-center text-gray-700 bg-gray-100 border border-gray-300 rounded-full overflow-clip px-4">
                                    <LockKeyhole size={20} className="text-neutral-400" />
                                    <input
                                        type={passwordVisible ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 text-gray-700 bg-gray-100 outline-none"
                                        placeholder="Min 6 chars"
                                        autoFocus
                                    />
                                    <span onClick={() => setPasswordVisible(!passwordVisible)} className="cursor-pointer text-neutral-400">
                                        {passwordVisible ? <Eye size={18} /> : <EyeClosed size={18} />}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block ml-3 text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="relative flex items-center text-gray-700 bg-gray-100 border border-gray-300 rounded-full overflow-clip px-4">
                                    <LockKeyhole size={20} className="text-neutral-400" />
                                    <input
                                        type={passwordVisible ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 text-gray-700 bg-gray-100 outline-none"
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>


                            {error && (
                                <p className="text-sm text-center text-red-500">{error}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 font-semibold text-white shadow-white bg-black rounded-full hover:bg-neutral-800 disabled:bg-gray-400 cursor-pointer"
                            >
                                {isLoading ? "creating account..." : "Sign Up"}
                            </Button>
                        </motion.div>
                    )}

                    <div className="text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-black hover:underline">
                            Sign In
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
