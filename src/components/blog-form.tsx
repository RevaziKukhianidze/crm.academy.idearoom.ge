"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Blog, BlogFormData } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "../../supabase/client";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface BlogFormProps {
  blog?: Blog;
}

export default function BlogForm({ blog }: BlogFormProps) {
  const initialData: BlogFormData = {
    title: blog?.title || "",
    text: blog?.text || "",
    image: blog?.image || "",
    image_file_path: blog?.image_file_path || "",
    image_file_name: blog?.image_file_name || "",
    tags: blog?.tags || [],
  };

  const [formData, setFormData] = useState<BlogFormData>(initialData);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false, // Ensure files are not overwritten
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        image: publicUrl,
        image_file_path: filePath,
        image_file_name: file.name,
      }));
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create a copy of formData to submit
      const dataToSubmit = { ...formData };

      if (blog) {
        // Update existing blog
        const { error } = await supabase
          .from("blogs")
          .update(dataToSubmit)
          .eq("id", blog.id);

        if (error) throw error;
      } else {
        // Create new blog
        const { error } = await supabase.from("blogs").insert([dataToSubmit]);

        if (error) throw error;
      }

      router.push("/dashboard/blogs");
      router.refresh();
    } catch (err: any) {
      console.error("Error saving blog:", err);
      setError(err.message || "Failed to save blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">სათაური</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="შეიყვანეთ ბლოგის სათაური"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">შინაარსი</Label>
            <Textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="შეიყვანეთ ბლოგის შინაარსი"
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">ბლოგის სურათი</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                name="image"
                value={formData.image || ""}
                onChange={handleChange}
                placeholder="შეიყვანეთ სურათის URL (არჩევითი)"
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileInputChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                ატვირთვა
              </Button>
            </div>

            {isUploading && (
              <div className="mt-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  იტვირთება: {uploadProgress}%
                </p>
              </div>
            )}

            {formData.image ? (
              <div className="mt-2 w-full max-w-xs h-40 rounded-md overflow-hidden bg-muted relative group">
                <img
                  src={formData.image}
                  alt="წინასწარი ხედი"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/300x200?text=Invalid+Image+URL";
                  }}
                />
                {formData.image_file_name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                    {formData.image_file_name}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 w-full max-w-xs h-40 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                <div className="text-muted-foreground flex flex-col items-center">
                  <ImageIcon size={40} strokeWidth={1} />
                  <span className="text-sm mt-2">სურათი არ არის არჩეული</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">ტეგები</Label>
            <div className="flex gap-2">
              <Input
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="დაამატეთ ტეგი"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                დამატება
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "ინახება..."
                : blog
                  ? "ბლოგის განახლება"
                  : "ბლოგის შექმნა"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/blogs")}
            >
              გაუქმება
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
