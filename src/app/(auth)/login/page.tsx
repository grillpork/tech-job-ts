"use client";
import { useUserStore } from "@/stores/faker/userStore";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login, isAuthenticated, currentUser } = useUserStore();
  const router = useRouter();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const path = ["admin", "manager", "lead_technician"].includes(
        currentUser.role
      )
        ? "/dashboard/admin/"
        : "/dashboard/employee/";
      router.replace(path);
    }
  }, [isAuthenticated, currentUser, router]);

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (isEmailValid) setStep("password");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const success = await login({ email, password });
    setIsLoading(false);

    if (success) {
      const user = useUserStore.getState().currentUser;
      if (user) {
        const path = ["admin", "manager", "lead_technician"].includes(user.role)
          ? "/dashboard/admin/"
          : "/dashboard/employee/";
        router.replace(path);
      }
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
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
          {/* Email */}
          <motion.div
            key="email-field"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <label className="block text-sm font-medium ml-3 text-gray-700">
              Email
            </label>
            <div className="flex items-center gap-2 w-full  text-gray-700 bg-gray-100 border border-gray-300 rounded-full overflow-clip">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 outline-none"
                placeholder="admin@example.com"
              />
              {step === "email" && isEmailValid && (
                <motion.button
                  key="next-btn"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: -2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  type="submit"
                  className="w-11 h-9 grid place-content-center font-semibold text-white bg-black rounded-full hover:bg-neutral-800 cursor-pointer"
                >
                  <ArrowRight size={22} />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Password */}
          <AnimatePresence>
            {step === "password" && (
              <motion.div
                key="password-field"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div>
                  <label className="block ml-3 mb-1 text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
                    placeholder="password123"
                  />
                </div>

                {error && (
                  <p className="text-sm text-center text-red-500">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 font-semibold text-white shadow-white rounded-full hover:bg-neutral-800 disabled:bg-gray-400 cursor-pointer"
                >
                  {isLoading ? "กำลังโหลด..." : "เข้าสู่ระบบ"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
