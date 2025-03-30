"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client-side Supabase initialization
const createClientSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
};

export default function LecturerForm() {
  const router = useRouter();
  const params = useParams();
  const lecturerId = params.id !== "new" ? params.id : null;
  const isEditMode = !!lecturerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    field: "",
    lecturer_text: "",
    lecturer_image: "",
  });

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

  // Fetch lecturer data if in edit mode
  useEffect(() => {
    const fetchLecturer = async () => {
      if (isEditMode && !loading) {
        try {
          console.log("Fetching lecturer with ID:", lecturerId);

          const supabase = createClientSupabase();
          const { data, error: fetchError } = await supabase
            .from("lecturers")
            .select("*")
            .eq("id", lecturerId)
            .single();

          if (fetchError) {
            console.error("Failed to fetch lecturer:", fetchError);
            setError(`Failed to load lecturer: ${fetchError.message}`);
          } else if (data) {
            console.log("Fetched lecturer data:", data);
            setFormData({
              fullName: data.fullName || "",
              field: data.field || "",
              lecturer_text: data.lecturer_text || "",
              lecturer_image: data.lecturer_image || "",
            });
          } else {
            setError("Lecturer not found");
          }
        } catch (err) {
          console.error("Error fetching lecturer:", err);
          setError(`Error: ${err.message}`);
        }
      }
    };

    fetchLecturer();
  }, [isEditMode, lecturerId, loading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      console.log(
        "Saving lecturer data:",
        isEditMode ? "update" : "create",
        formData
      );

      const supabase = createClientSupabase();
      let result;

      if (isEditMode) {
        // Update existing lecturer
        const { data, error: updateError } = await supabase
          .from("lecturers")
          .update({
            fullName: formData.fullName,
            field: formData.field,
            lecturer_text: formData.lecturer_text,
            lecturer_image: formData.lecturer_image,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lecturerId);

        if (updateError) {
          throw new Error(`Failed to update: ${updateError.message}`);
        }

        result = data;
      } else {
        // Insert new lecturer
        const { data, error: insertError } = await supabase
          .from("lecturers")
          .insert({
            fullName: formData.fullName,
            field: formData.field,
            lecturer_text: formData.lecturer_text,
            lecturer_image: formData.lecturer_image,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (insertError) {
          throw new Error(`Failed to create: ${insertError.message}`);
        }

        result = data;
      }

      console.log("Save successful:", result);

      // Success, redirect to lecturers page
      router.push("/dashboard/lecturer");
    } catch (err) {
      console.error("Error saving lecturer:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href="/dashboard/lecturer">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Lecturers
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Lecturer" : "Add New Lecturer"}
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error: {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter lecturer's full name"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="field">Field of Expertise</Label>
              <Input
                id="field"
                name="field"
                value={formData.field}
                onChange={handleInputChange}
                placeholder="E.g., Computer Science, Mathematics, Physics"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="lecturer_image">Profile Image URL</Label>
              <Input
                id="lecturer_image"
                name="lecturer_image"
                value={formData.lecturer_image}
                onChange={handleInputChange}
                placeholder="Enter image URL"
              />
              {formData.lecturer_image && (
                <div className="mt-2">
                  <p className="mb-1 text-sm text-gray-500">Preview:</p>
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <img
                      src={formData.lecturer_image}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-image.jpg";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="lecturer_text">Biography</Label>
              <Textarea
                id="lecturer_text"
                name="lecturer_text"
                value={formData.lecturer_text}
                onChange={handleInputChange}
                placeholder="Enter lecturer's biography or description"
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Lecturer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
