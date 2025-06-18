"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import BlogTable from "@/components/blog-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import CacheClearButton from "@/components/cache-clear-button";
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

  // Data fetching via API route to get parsed tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use API route to get properly parsed tags
        const response = await fetch("/api/blogs");

        if (!response.ok) {
          console.error("Error fetching blogs:", response.statusText);
          setBlogs([]);
          return;
        }

        const fetchedBlogs = await response.json();
        console.log("Fetched blogs with parsed tags:", fetchedBlogs); // Debug log
        setBlogs(fetchedBlogs || []);
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
          <div className="flex items-center gap-3">
            <CacheClearButton type="blogs" />
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
        </div>
        <BlogTable initialBlogs={blogs} />
      </div>
    </>
  );
}
