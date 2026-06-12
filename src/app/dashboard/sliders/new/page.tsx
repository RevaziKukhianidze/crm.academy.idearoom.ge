"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import SliderForm from "@/components/slider-form";

export default function NewSliderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      if (!isAuthenticated) {
        router.replace("/");
      } else {
        setLoading(false);
      }
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("isAuthenticated");
      router.push("/");
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">იტვირთება...</div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">ახალი სლაიდის დამატება</h1>
          </div>
          <SliderForm />
        </div>
      </main>
    </>
  );
}