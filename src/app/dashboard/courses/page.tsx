"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import CourseTable from "../../../components/course-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "../../../../supabase/server";

// Define the Course interface to match what CourseTable expects
export interface Course {
  id: number;
  created_at: string;
  title?: string;
  course_details?: string;
  image?: string;
  start_course?: string;
  quantity_lessons?: number;
  quantity_of_students?: number;
  lesson_time?: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

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
        const { data: fetchedCourses, error } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching courses:", error);
          setCourses([]); // Set empty array on error
        } else {
          setCourses(fetchedCourses || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setCourses([]);
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
            <h1 className="text-3xl font-bold">კურსების მართვა</h1>
            <Link href="/dashboard/courses/new">
              <Button className="flex items-center gap-2">
                <PlusCircle size={16} />
                ახალი კურსი
              </Button>
            </Link>
          </div>
          <CourseTable initialCourses={courses} />
        </div>
      </main>
    </>
  );
}
