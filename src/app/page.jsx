"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail, Lock, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated === "true") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check email and password
    if (email === "idearoom2025!@gmail.com" && password === "idearoom2025!!") {
      // Save session in localStorage
      localStorage.setItem("isAuthenticated", "true");

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Redirect user to secure page
      router.push("/dashboard");
    } else {
      setError("არასწორი ელფოსტა ან პაროლი");
      setIsLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-purple-200 shadow-2xl overflow-hidden transition-all duration-300">
        <div className="relative bg-gradient-to-r from-purple-600 to-purple-800 p-8 border-b-4 border-purple-900">
          <button
            className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm p-1.5 rounded-full hover:bg-white/20 transition-colors duration-200"
            aria-label="Close"
          >
            <X size={18} className="text-white" />
          </button>

          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg">
              <LogIn size={28} className="text-purple-700" />
            </div>
            <h2 className="text-2xl font-bold text-center text-black">
              ავტორიზაცია
            </h2>
            <div className="h-1 w-20 bg-purple-300 rounded-full"></div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ელ-ფოსტა
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-lg border border-gray-300 py-3 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                  placeholder="თქვენი ელფოსტა"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  პაროლი
                </label>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-lg border border-gray-300 py-3 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                  placeholder="თქვენი პაროლი"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff
                      className="h-5 w-5 text-gray-400 hover:text-gray-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <Eye
                      className="h-5 w-5 text-gray-400 hover:text-gray-500"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  დამიმახსოვრე
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 border border-purple-800 shadow-lg text-white font-medium rounded-lg focus:outline-none hover:from-purple-700 hover:to-purple-800 active:shadow-inner transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  იტვირთება...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LogIn size={18} className="mr-2" />
                  შესვლა
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
