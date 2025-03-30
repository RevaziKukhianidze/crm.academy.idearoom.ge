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
import { createClient } from "../../../../supabase/server";

export default function SlidersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchMethod, setFetchMethod] = useState<string>("direct");

  // Authentication check
  useEffect(() => {
    try {
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      if (!isAuthenticated) {
        router.replace("/");
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("localStorage is not available:", err);
      router.replace("/");
    }
  }, [router]);

  // Fetch data using the selected method
  useEffect(() => {
    if (loading) return;

    const fetchData = async () => {
      setError(null);

      if (fetchMethod === "api") {
        await fetchWithApi();
      } else {
        await fetchWithSupabase();
      }
    };

    fetchData();
  }, [loading, refreshing, fetchMethod]);

  // API fetch method
  const fetchWithApi = async () => {
    try {
      console.log("Attempting to fetch sliders via API...");
      const response = await fetch("/api/sliders");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch slider data from API"
        );
      }

      const data = await response.json();
      console.log("Successfully fetched sliders via API:", data);

      if (!Array.isArray(data)) {
        console.error("API returned non-array data:", data);
        throw new Error("API returned invalid data format");
      }

      setSliderItems(data);
    } catch (err) {
      console.error("Error fetching slider items via API:", err);
      setError(
        `API error: ${err instanceof Error ? err.message : String(err)}`
      );

      // If API fails, fall back to direct Supabase
      console.log("API fetch failed, falling back to direct Supabase fetch");
      setFetchMethod("direct");
    } finally {
      setRefreshing(false);
    }
  };

  // Direct Supabase fetch method
  const fetchWithSupabase = async () => {
    try {
      console.log("Attempting to fetch sliders directly from Supabase...");
      const supabase = await createClient();

      // Get the data with a timeout to prevent hanging
      const fetchPromise = supabase
        .from("slider")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: fetchedSliderItems, error: supabaseError } =
        await fetchPromise;

      if (supabaseError) {
        console.error("Supabase error:", supabaseError);
        throw supabaseError;
      }

      console.log("Successfully fetched sliders directly:", fetchedSliderItems);

      if (!Array.isArray(fetchedSliderItems)) {
        console.error("Supabase returned non-array data:", fetchedSliderItems);
        throw new Error("Supabase returned invalid data format");
      }

      setSliderItems(fetchedSliderItems);
    } catch (err) {
      console.error("Error fetching data directly from Supabase:", err);
      setError(
        `Direct DB error: ${err instanceof Error ? err.message : String(err)}`
      );
      setSliderItems([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handleToggleFetchMethod = () => {
    setFetchMethod((prev) => (prev === "api" ? "direct" : "api"));
    setRefreshing(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("isAuthenticated");
      router.push("/");
    } catch (err) {
      console.error("localStorage is not available:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">იტვირთება...</div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full bg-slate-50/40 dark:bg-slate-950/40 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-8">
          {/* Slider Management Section */}
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
