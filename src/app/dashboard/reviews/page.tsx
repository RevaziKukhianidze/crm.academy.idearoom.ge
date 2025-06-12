"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DashboardNavbar from "@/components/dashboard-navbar";
import ReviewTable from "@/components/review-table";
import { Review } from "@/types/review";
import { supabase } from "../../../../supabase/client";
import { PlusCircle } from "lucide-react";

export default function ReviewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

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

  // Fetch reviews from Supabase
  useEffect(() => {
    if (!loading) {
      fetchReviews();
    }
  }, [loading]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("review")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        // Try alternative table name
        const { data: altData, error: altError } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false });

        if (!altError && altData) {
          setReviews(altData || []);
        }
      } else {
        setReviews(data || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
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
        იტვირთება...
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">შეფასებების მართვა</h1>
            <div className="flex gap-2">
              <Button onClick={fetchReviews} variant="outline">
                🔄 Refresh
              </Button>
              <Link href="/dashboard/reviews/new">
                <Button className="flex items-center gap-2">
                  <PlusCircle size={16} />
                  ახალი შეფასება
                </Button>
              </Link>
            </div>
          </div>
          <ReviewTable initialReviews={reviews} />
        </div>
      </main>
    </>
  );
}
