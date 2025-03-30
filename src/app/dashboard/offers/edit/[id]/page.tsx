"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import OfferedCourseForm from "@/components/offered-course-form";
import { OfferedCourse } from "@/types/offered-course";
import { createClient } from "../../../../../../supabase/server";

export default function EditOfferedCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<OfferedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authentication check and course data fetching
  useEffect(() => {
    const checkAuthAndFetchCourse = async () => {
      try {
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        if (!isAuthenticated) {
          router.replace("/");
          return;
        }

        // Fetch the offered course
        const supabase = await createClient();
        const { data: courseData, error: fetchError } = await supabase
          .from("offered_course")
          .select("*")
          .eq("id", parseInt(params.id, 10))
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching offered course:", fetchError);
          setError("შეთავაზების მონაცემების მიღება ვერ მოხერხდა");
          setTimeout(() => {
            router.replace("/dashboard/offers");
          }, 2000);
          return;
        }

        if (!courseData) {
          console.error("Offered course not found");
          setError("შეთავაზება ვერ მოიძებნა");
          setTimeout(() => {
            router.replace("/dashboard/offers");
          }, 2000);
          return;
        }

        setCourse(courseData);
        setLoading(false);
      } catch (err) {
        console.error("Error in authentication or data fetching:", err);
        router.replace("/");
      }
    };

    checkAuthAndFetchCourse();
  }, [router, params.id]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">შეცდომა</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm mt-4">
            გადამისამართდება შეთავაზებების გვერდზე...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <h1 className="text-3xl font-bold">შეთავაზების რედაქტირება</h1>
          {course && <OfferedCourseForm course={course} />}
        </div>
      </main>
    </>
  );
}
