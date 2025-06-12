"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import ReviewForm from "@/components/review-form";
import { Review } from "@/types/review";
import { supabase } from "../../../../../../supabase/client";

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch review data
  useEffect(() => {
    if (!loading && params?.id) {
      fetchReview();
    }
  }, [loading, params?.id]);

  const fetchReview = async () => {
    try {
      const { data, error } = await supabase
        .from("review")
        .select("*")
        .eq("id", params?.id)
        .single();

      if (error) {
        console.error("Error fetching review:", error);
        setError("შეფასება ვერ მოიძებნა");
      } else {
        setReview(data);
      }
    } catch (error) {
      console.error("Error fetching review:", error);
      setError("შეფასება ვერ მოიძებნა");
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

  if (error) {
    return (
      <>
        <DashboardNavbar handleLogOut={handleLogout} />
        <main className="w-full">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">შეცდომა</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => router.push("/dashboard/reviews")}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                შეფასებების სიაზე დაბრუნება
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <h1 className="text-3xl font-bold">შეფასების რედაქტირება</h1>
          {review && <ReviewForm review={review} />}
        </div>
      </main>
    </>
  );
}
