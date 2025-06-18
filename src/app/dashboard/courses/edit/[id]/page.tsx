"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import CourseForm from "@/components/course-form";
import { Course } from "../../../../../types/course";
import { createClient } from "../../../../../../supabase/server";

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Function to fetch course data
  const fetchCourseData = async () => {
    try {
      console.log(`Fetching course with ID: ${params.id}`);

      // Fetch the course via API route to ensure consistent access
      const response = await fetch(
        `/api/courses?id=${params.id}&t=${Date.now()}`
      );

      console.log(`API response status: ${response.status}`);

      let courseData: any = null;
      if (response.ok) {
        const json = await response.json();
        console.log("API response data:", json);
        if (!json.error) {
          courseData = json;
        } else {
          console.error("API returned error:", json.error);
        }
      } else {
        const errorText = await response.text();
        console.error("API request failed:", response.status, errorText);
      }

      // If API route failed (e.g., returns error or empty), fall back to direct Supabase query
      if (!courseData) {
        console.log("Falling back to direct Supabase query");
        const supabase = await createClient();
        const { data, error: fetchError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", parseInt(params.id, 10))
          .maybeSingle();

        console.log("Supabase query result:", { data, error: fetchError });

        if (fetchError) {
          console.error("Supabase fallback error:", fetchError);
        }
        courseData = data;
      }

      if (!courseData) {
        console.error(
          `Course not found through API or direct query for ID: ${params.id}`
        );
        router.replace("/dashboard/courses");
        return null;
      }

      console.log("Successfully fetched course data:", courseData);
      return courseData;
    } catch (err) {
      console.error("Error fetching course data:", err);
      return null;
    }
  };

  // Authentication check and course data fetching
  useEffect(() => {
    const checkAuthAndFetchCourse = async () => {
      try {
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        if (!isAuthenticated) {
          router.replace("/");
          return;
        }

        const courseData = await fetchCourseData();
        if (courseData) {
          setCourse(courseData);
        }
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

  const handleCourseUpdate = async () => {
    try {
      // Clear any existing errors and show success message
      setError(null);

      // Re-fetch the updated course data without showing loading spinner
      const updatedCourseData = await fetchCourseData();

      if (updatedCourseData) {
        setCourse(updatedCourseData);
        // Show success message
        setSuccessMessage("კურსი წარმატებით განახლდა!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error("Error updating course:", err);
      setError("კურსის განახლების დროს მოხდა შეცდომა");
      setSuccessMessage(null);
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

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}

          {course && (
            <CourseForm course={course} onUpdate={handleCourseUpdate} />
          )}
        </div>
      </main>
    </>
  );
}
