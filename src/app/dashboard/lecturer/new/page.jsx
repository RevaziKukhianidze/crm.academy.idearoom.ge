"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client-side Supabase initialization
const createClientSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase-ის გარემოს ცვლადები არ არის განსაზღვრული");
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
};

export default function LecturerForm() {
  const router = useRouter();
  const params = useParams();
  const lecturerId = params.id !== "new" ? params.id : null;
  const isEditMode = !!lecturerId;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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
      console.error("localStorage არ არის ხელმისაწვდომი:", err);
      router.replace("/");
    }
  }, [router]);

  // Fetch lecturer data if in edit mode
  useEffect(() => {
    const fetchLecturer = async () => {
      if (isEditMode && !loading) {
        try {
          // Use Supabase client directly instead of API route
          const supabase = createClientSupabase();
          const { data, error: fetchError } = await supabase
            .from("lecturers")
            .select("*")
            .eq("id", lecturerId)
            .single();

          if (fetchError) {
            console.error("ლექტორის მიღება ვერ მოხერხდა:", fetchError);
            setError(fetchError.message);
          } else if (data) {
            setFormData({
              fullName: data.fullName || "",
              field: data.field || "",
              lecturer_text: data.lecturer_text || "",
              lecturer_image: data.lecturer_image || "",
            });

            if (data.lecturer_image) {
              setPreviewUrl(data.lecturer_image);
            }
          }
        } catch (err) {
          console.error("ლექტორის მიღების შეცდომა:", err);
          setError(err.message);
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

    // Update preview if the image URL is entered manually
    if (name === "lecturer_image" && value) {
      setPreviewUrl(value);
    } else if (name === "lecturer_image" && !value) {
      setPreviewUrl(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);
    setError(null);

    try {
      const supabase = createClientSupabase();

      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `lecturer_images/${fileName}`;

      // Upload file to Supabase Storage - using the "lecturers" bucket
      const { data, error } = await supabase.storage
        .from("lecturers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get the public URL - use the same "lecturers" bucket name
      const {
        data: { publicUrl },
      } = supabase.storage.from("lecturers").getPublicUrl(filePath);

      // Update form data with the new image URL
      setFormData((prev) => ({
        ...prev,
        lecturer_image: publicUrl,
      }));
    } catch (err) {
      console.error("სურათის ატვირთვის შეცდომა:", err);
      setError(`სურათის ატვირთვა ვერ მოხერხდა: ${err.message}`);

      // Keep the local preview for better UX even if upload failed
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFormData((prev) => ({
      ...prev,
      lecturer_image: "",
    }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClientSupabase();
      let response;

      if (isEditMode) {
        // Update existing lecturer
        response = await supabase
          .from("lecturers")
          .update({
            fullName: formData.fullName,
            field: formData.field,
            lecturer_text: formData.lecturer_text,
            lecturer_image: formData.lecturer_image,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lecturerId);
      } else {
        // Insert new lecturer
        response = await supabase.from("lecturers").insert({
          fullName: formData.fullName,
          field: formData.field,
          lecturer_text: formData.lecturer_text,
          lecturer_image: formData.lecturer_image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Success, redirect to lecturers page
      router.push("/dashboard/lecturer");
    } catch (err) {
      console.error("ლექტორის შენახვის შეცდომა:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">იტვირთება...</p>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/lecturer">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ლექტორებთან დაბრუნება
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isEditMode ? "ლექტორის რედაქტირება" : "ახალი ლექტორის დამატება"}
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">სრული სახელი</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="შეიყვანეთ ლექტორის სრული სახელი"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field">სფერო</Label>
              <Input
                id="field"
                name="field"
                value={formData.field}
                onChange={handleInputChange}
                placeholder="მაგ. მათემატიკა, ფიზიკა და ა.შ."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lecturer_text">ლექტორის შესახებ</Label>
            <Textarea
              id="lecturer_text"
              name="lecturer_text"
              value={formData.lecturer_text}
              onChange={handleInputChange}
              placeholder="შეიყვანეთ ინფორმაცია ლექტორის შესახებ"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>ლექტორის სურათი</Label>
            <div className="flex gap-2">
              <Input
                name="lecturer_image"
                value={formData.lecturer_image}
                onChange={handleInputChange}
                placeholder="შეიყვანეთ სურათის URL ან აირჩიეთ ფაილი"
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "იტვირთება..." : "ატვირთვა"}
              </Button>
            </div>

            {previewUrl && (
              <div className="relative mt-4">
                <div className="w-full max-w-xs h-40 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={previewUrl}
                    alt="ლექტორის სურათის გადახედვა"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/150?text=Image+Error";
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {!previewUrl && (
              <div className="w-full max-w-xs h-40 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 mt-4">
                <div className="text-gray-500 flex flex-col items-center">
                  <ImageIcon size={48} strokeWidth={1} />
                  <span className="mt-2 text-sm">სურათი არ არის არჩეული</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/dashboard/lecturer">
              <Button type="button" variant="outline">
                გაუქმება
              </Button>
            </Link>
            <Button type="submit" className="gap-2" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "ინახება..." : isEditMode ? "განახლება" : "შენახვა"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
