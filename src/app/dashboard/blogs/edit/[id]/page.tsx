"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import BlogForm from "@/components/blog-form";
import { Blog } from "@/types/blog";
import { createClient } from "../../../../../../supabase/server";

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authentication check and blog data fetching
  useEffect(() => {
    const checkAuthAndFetchBlog = async () => {
      try {
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        if (!isAuthenticated) {
          router.replace("/");
          return;
        }

        // Fetch the blog
        const supabase = await createClient();
        const { data: blogData, error: fetchError } = await supabase
          .from("blogs")
          .select("*")
          .eq("id", parseInt(params.id, 10))
          .maybeSingle();

        if (fetchError || !blogData) {
          console.error("Error fetching blog or blog not found:", fetchError);
          setError("ბლოგი ვერ მოიძებნა");
          setTimeout(() => {
            router.replace("/dashboard/blogs");
          }, 2000);
          return;
        }

        setBlog(blogData);
        setLoading(false);
      } catch (err) {
        console.error("Error in authentication or data fetching:", err);
        router.replace("/");
      }
    };

    checkAuthAndFetchBlog();
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
          <p className="text-sm mt-4">გადამისამართდება ბლოგების გვერდზე...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <h1 className="text-3xl font-bold">ბლოგის რედაქტირება</h1>
          {blog && <BlogForm blog={blog} />}
        </div>
      </main>
    </>
  );
}
