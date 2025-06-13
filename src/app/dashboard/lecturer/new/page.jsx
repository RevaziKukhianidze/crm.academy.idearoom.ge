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
  const [success, setSuccess] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    field: "",
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
    console.log(`Input changed: ${name} = ${value}`);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update preview if the image URL is entered manually
    if (name === "lecturer_image" && value) {
      console.log("Setting preview URL from manual input:", value);
      setPreviewUrl(value);
      setError(null);
      setSuccess(null);
    } else if (name === "lecturer_image" && !value) {
      console.log("Clearing preview URL");
      setPreviewUrl(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("გთხოვთ, აირჩიოთ სწორი ფორმატის სურათი (JPG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს");
      return;
    }

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClientSupabase();

      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `lecturer_images/${fileName}`;

      console.log("ფაილის ატვირთვა იწყება:", filePath);

      // First, try to check if bucket exists and create if needed
      console.log("Checking Supabase storage bucket...");

      try {
        const { data: buckets, error: bucketError } =
          await supabase.storage.listBuckets();
        console.log("Available buckets:", buckets);

        const lecturerBucket = buckets?.find(
          (bucket) => bucket.name === "lecturers"
        );
        if (!lecturerBucket) {
          console.log("lecturers bucket not found, trying to create...");
          // Note: This might fail due to permissions, but we'll try
          const { data: newBucket, error: createError } =
            await supabase.storage.createBucket("lecturers", {
              public: true,
              allowedMimeTypes: [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
              ],
              fileSizeLimit: 5242880, // 5MB
            });

          if (createError) {
            console.error("Could not create bucket:", createError);
            throw new Error(
              `Storage bucket შეცდომა: ${createError.message}. გთხოვთ, შეამოწმოთ Supabase პროექტის კონფიგურაცია.`
            );
          }
          console.log("Bucket created successfully:", newBucket);
        }
      } catch (bucketErr) {
        console.error("Bucket check/creation error:", bucketErr);
        // Continue with upload anyway, maybe bucket exists but we can't list it
      }

      // Upload file to Supabase Storage - using the "lecturers" bucket
      console.log("Starting file upload to bucket...");
      const { data, error } = await supabase.storage
        .from("lecturers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));

        // Try alternative approach - upload to a different bucket or use base64
        if (
          error.message.includes("bucket") ||
          error.message.includes("not found")
        ) {
          throw new Error(
            `Storage bucket არ არსებობს. გთხოვთ, შექმენით 'lecturers' bucket Supabase Storage-ში.`
          );
        }

        throw new Error(`ატვირთვის შეცდომა: ${error.message}`);
      }

      console.log("ფაილი წარმატებით აიტვირთა:", data);

      // Get the public URL - use the same "lecturers" bucket name
      const {
        data: { publicUrl },
      } = supabase.storage.from("lecturers").getPublicUrl(filePath);

      console.log("მიღებული public URL:", publicUrl);

      if (!publicUrl) {
        throw new Error("სურათის URL-ის მიღება ვერ მოხერხდა");
      }

      // Update form data with the new image URL
      setFormData((prev) => ({
        ...prev,
        lecturer_image: publicUrl,
      }));

      // Clean up the object URL
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(publicUrl);

      console.log("სურათი წარმატებით აიტვირთა და URL განახლდა");
      setSuccess("სურათი წარმატებით აიტვირთა!");
    } catch (err) {
      console.error("სურათის ატვირთვის შეცდომა:", err);

      // Try fallback: convert to base64 and store directly
      console.log("Trying fallback: converting to base64...");
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target.result;
          console.log(
            "Base64 conversion successful, length:",
            base64Data.length
          );

          setFormData((prev) => ({
            ...prev,
            lecturer_image: base64Data,
          }));

          // Clean up the object URL and use base64 for preview
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(base64Data);

          setSuccess("სურათი წარმატებით აიტვირთა! (fallback მეთოდი)");
          setError(null);
        };

        reader.onerror = () => {
          console.error("Base64 conversion failed");
          handleUploadFailure();
        };

        reader.readAsDataURL(file);
      } catch (base64Err) {
        console.error("Base64 fallback failed:", base64Err);
        handleUploadFailure();
      }

      function handleUploadFailure() {
        setError(`სურათის ატვირთვა ვერ მოხერხდა: ${err.message}`);

        // Clear the preview if upload failed
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
        setFormData((prev) => ({
          ...prev,
          lecturer_image: "",
        }));

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
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
    setSuccess(null);

    // Validate required fields
    if (!formData.fullName.trim()) {
      setError("სრული სახელი აუცილებელია");
      setSaving(false);
      return;
    }

    try {
      const supabase = createClientSupabase();
      let response;

      console.log("ლექტორის შენახვა იწყება:", {
        ...formData,
        lecturer_image: formData.lecturer_image
          ? `${formData.lecturer_image.substring(0, 50)}... (length: ${formData.lecturer_image.length})`
          : "არ არის",
      });

      const lecturerData = {
        fullName: formData.fullName,
        field: formData.field,
        lecturer_image: formData.lecturer_image,
      };

      if (isEditMode) {
        // Update existing lecturer
        console.log("Updating lecturer with ID:", lecturerId);
        response = await supabase
          .from("lecturers")
          .update({
            ...lecturerData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lecturerId)
          .select(); // Add select to get the updated data back
      } else {
        // Insert new lecturer
        console.log("Inserting new lecturer");
        response = await supabase
          .from("lecturers")
          .insert({
            ...lecturerData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select(); // Add select to get the inserted data back
      }

      if (response.error) {
        console.error("Supabase შენახვის შეცდომა:", response.error);
        throw new Error(response.error.message);
      }

      console.log("ლექტორი წარმატებით შენახულია:", response);

      // Success, redirect to lecturers page
      router.push("/dashboard/lecturer");
    } catch (err) {
      console.error("ლექტორის შენახვის შეცდომა:", err);
      setError(`ლექტორის შენახვა ვერ მოხერხდა: ${err.message}`);
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
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-sm mt-2 underline"
            >
              დახურვა
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-500 hover:text-green-700 text-sm mt-2 underline"
            >
              დახურვა
            </button>
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
            <Label>ლექტორის სურათი</Label>
            <div className="flex gap-2">
              <Input
                name="lecturer_image"
                value={formData.lecturer_image}
                onChange={handleInputChange}
                placeholder="შეიყვანეთ სურათის URL ან აირჩიეთ ფაილი"
              />
              <div className="text-xs text-gray-500 flex items-center px-2">
                {formData.lecturer_image
                  ? `✓ ${formData.lecturer_image.length > 50 ? "ფაილი" : "URL"}`
                  : "არ არის"}
              </div>
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
                <div className="w-full max-w-xs h-40 rounded-md overflow-hidden bg-gray-100 border-2 border-green-200">
                  <img
                    src={previewUrl}
                    alt="ლექტორის სურათის გადახედვა"
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log(
                        "Image loaded successfully:",
                        previewUrl.substring(0, 50) + "..."
                      );
                    }}
                    onError={(e) => {
                      console.error("Image load error for URL:", previewUrl);
                      e.target.src =
                        "https://via.placeholder.com/150x150/cccccc/666666?text=Image+Error";
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
                <div className="mt-2 text-sm text-green-600">
                  ✓ სურათი მზადაა შესანახად
                </div>
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
