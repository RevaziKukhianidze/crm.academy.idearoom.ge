"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import CourseForm from "@/components/course-form";
import { Course } from "@/components/course-form";
import { createClient } from "../../../../../../supabase/server";

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
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

        // Fetch the course
        const supabase = await createClient();
        const { data: courseData, error: fetchError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", parseInt(params.id, 10))
          .maybeSingle();

        if (fetchError || !courseData) {
          console.error(
            "Error fetching course or course not found:",
            fetchError
          );
          setError("კურსი ვერ მოიძებნა");
          setTimeout(() => {
            router.replace("/dashboard/courses");
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
          <p className="text-sm mt-4">გადამისამართდება კურსების გვერდზე...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <h1 className="text-3xl font-bold">კურსის რედაქტირება</h1>
          {course && <CourseForm course={course} />}
        </div>
      </main>
    </>
  );
}
