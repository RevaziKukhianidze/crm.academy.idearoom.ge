"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import SliderTable from "@/components/slider-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, RefreshCw } from "lucide-react";
import { SliderItem } from "@/components/slider-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SlidersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth check
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

  // Fetch sliders
  useEffect(() => {
    if (loading) return;
    fetchSliders();
  }, [loading, refreshing]);

  const fetchSliders = async () => {
    setError(null);
    try {
      const response = await fetch("/api/sliders");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "მონაცემების ჩატვირთვა ვერ მოხერხდა");
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("სერვერიდან მოვიდა არასწორი ფორმატი");
      setSliderItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSliderItems([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => setRefreshing(true);

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
      <main className="w-full bg-slate-50/40 dark:bg-slate-950/40 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-2xl md:text-3xl">
                    სლაიდერის მართვა
                  </CardTitle>
                  <CardDescription>
                    დაამატეთ, შეცვალეთ ან წაშალეთ სლაიდერის ელემენტები
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-10 w-10"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Link href="/dashboard/sliders/new">
                    <Button className="h-10 flex items-center gap-2">
                      <PlusCircle size={16} />
                      ახალი სლაიდი
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-red-500 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 mb-6 rounded-r-md">
                  {error}
                </div>
              )}
              <SliderTable initialSliderItems={sliderItems} />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}