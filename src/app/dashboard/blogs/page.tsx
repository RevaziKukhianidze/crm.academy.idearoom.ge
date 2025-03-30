"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import BlogTable from "@/components/blog-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "../../../../supabase/server";
import { supabase } from "../../../../supabase/client";
import { Blog } from "@/types/blog";

export default function BlogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);

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
        // Option 1: Using server-side client
        const supabaseClient = await createClient();
        const { data: fetchedBlogs, error } = await supabaseClient
          .from("blogs")
          .select("*")
          .order("created_at", { ascending: false });

        // Option 2: Using browser client (uncomment if needed)
        // const { data: fetchedBlogs, error } = await supabase
        //   .from("blogs")
        //   .select("*")
        //   .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching blogs:", error);
          setBlogs([]); // Set empty array on error
        } else {
          setBlogs(fetchedBlogs || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setBlogs([]);
      } finally {
        setLoading(false);
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
      <div className="flex justify-center items-center h-screen">
        იტვირთება...
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ბლოგების მართვა</h1>
          <Button asChild>
            <Link
              href="/dashboard/blogs/new"
              className="flex items-center gap-2"
            >
              <PlusCircle size={16} />
              ახალი ბლოგი
            </Link>
          </Button>
        </div>
        <BlogTable initialBlogs={blogs} />
      </div>
    </>
  );
}
