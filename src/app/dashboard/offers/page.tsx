"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import OfferedCourseTable from "../../../components/offered-course-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "../../../../supabase/server";
import { OfferedCourse } from "@/types/offered-course";

export default function OffersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offeredCourses, setOfferedCourses] = useState<OfferedCourse[]>([]);

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

  // Data fetching from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = await createClient();
        // Explicitly order by created_at descending to get newest first
        const { data: fetchedOfferedCourses, error } = await supabase
          .from("offered_course")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching offered courses:", error);
          setOfferedCourses([]); // Set empty array on error
        } else {
          // Log the first few courses to verify ordering
          if (fetchedOfferedCourses && fetchedOfferedCourses.length > 0) {
            console.log(
              "Fetched courses with created_at dates (newest first):",
              fetchedOfferedCourses.slice(0, 3).map((c) => ({
                id: c.id,
                created_at: c.created_at,
              }))
            );
          }

          setOfferedCourses(fetchedOfferedCourses || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setOfferedCourses([]);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [loading]);

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
            <h1 className="text-3xl font-bold">შეთავაზებების მართვა</h1>
            <Link href="/dashboard/offers/new">
              <Button className="flex items-center gap-2">
                <PlusCircle size={16} />
                ახალი შეთავაზება
              </Button>
            </Link>
          </div>
          <OfferedCourseTable initialOfferedCourses={offeredCourses} />
        </div>
      </main>
    </>
  );
}
