"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import CourseForm from "@/components/course-form";
import { Button } from "@/components/ui/button";
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
      console.log(
        `🔍 Fetching course with ID: ${params.id} (type: ${typeof params.id})`
      );

      const supabase = await createClient();

      // ჯერ შევამოწმოთ ყველა კურსი ბაზაში
      const { data: allCourses, error: allError } = await supabase
        .from("courses")
        .select("*");

      console.log(`📊 Total courses in database: ${allCourses?.length || 0}`);
      console.log(
        `📝 All course IDs:`,
        allCourses?.map((c) => `${c.id} (${typeof c.id})`) || []
      );

      // Check if ID 47 exists in the array
      const targetId = parseInt(params.id, 10);
      const foundInArray = allCourses?.find((c) => c.id === targetId);
      console.log(`🔎 Is ID ${targetId} in the courses array?`, !!foundInArray);

      if (allError) {
        console.error("❌ Error fetching all courses:", allError);
      }

      // ახლა ვეძებთ კონკრეტულ კურსს
      const courseId = parseInt(params.id, 10);
      console.log(
        `🎯 Searching for course ID: ${courseId} (parsed from "${params.id}")`
      );

      const { data, error: fetchError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .maybeSingle();

      console.log("📋 Supabase query result:", { data, error: fetchError });
      console.log("📋 Detailed data object:", JSON.stringify(data, null, 2));

      if (fetchError) {
        console.error("❌ Supabase query error:", fetchError);
        setError(`კურსის ძებნის დროს მოხდა შეცდომა: ${fetchError.message}`);
        return null;
      }

      if (!data) {
        console.error(
          `❌ Course not found for ID: ${params.id} (parsed: ${courseId})`
        );
        setError(`კურსი ვერ მოიძებნა ID-ით: ${params.id}`);
        return null;
      }

      console.log("✅ Successfully fetched course data:", data);
      console.log("✅ Course title:", data.title);
      console.log("✅ Course ID:", data.id);
      return data;
    } catch (err) {
      console.error("❌ Error fetching course data:", err);
      setError(`კურსის ძებნის დროს მოხდა შეცდომა: ${err}`);
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
        console.log("🎯 After fetchCourseData, got:", courseData);

        if (courseData) {
          console.log("🎯 Setting course to state:", courseData.title);
          setCourse(courseData);
        } else {
          console.log("❌ courseData is null/undefined, not setting course");
        }

        console.log("🎯 Setting loading to false");
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
      // Clear any existing errors
      setError(null);
      setSuccessMessage(null);

      // Re-fetch the updated course data to ensure UI is in sync
      const updatedCourseData = await fetchCourseData();

      if (updatedCourseData) {
        setCourse(updatedCourseData);
        // Show success message
        setSuccessMessage("კურსი წარმატებით განახლდა!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        // If fetchCourseData failed, it will have set the error message
        console.error("Failed to fetch updated course data");
      }
    } catch (err) {
      console.error("Error in handleCourseUpdate:", err);
      setError("კურსის განახლების დროს მოხდა შეცდომა");
      setSuccessMessage(null);
    }
  };

  console.log(
    "🖥️ RENDER - loading:",
    loading,
    "error:",
    error,
    "course:",
    course?.title || "no course"
  );

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
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-2">შეცდომა</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">შესაძლო მიზეზები:</p>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>• კურსი ID {params.id} ვერ მოიძებნა</li>
              <li>• კურსები table ცარიელია</li>
              <li>• ბაზასთან კავშირის პრობლემა</li>
            </ul>
            <div className="mt-4 space-x-2">
              <Button
                onClick={() => router.push("/dashboard/courses")}
                variant="outline"
              >
                ← კურსების სია
              </Button>
              <Button onClick={() => router.push("/dashboard/courses/new")}>
                + ახალი კურსი
              </Button>
            </div>
          </div>
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

          {course ? (
            <>
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-4">
                კურსი მოიძებნა: <strong>{course.title}</strong> (ID: {course.id}
                )
              </div>
              <CourseForm course={course} onUpdate={handleCourseUpdate} />
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
              კურსი ჯერ არ არის ჩატვირთული...
            </div>
          )}
        </div>
      </main>
    </>
  );
}
