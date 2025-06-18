"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Blog, BlogFormData, BlogTag } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "../../supabase/client";
import {
  X,
  Upload,
  Image as ImageIcon,
  Plus,
  Link,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";

interface BlogFormProps {
  blog?: Blog;
  onUpdate?: () => void;
}

export default function BlogForm({ blog, onUpdate }: BlogFormProps) {
  // Helper function to ensure tags are in correct format
  const ensureTagFormat = (tag: any): BlogTag => {
    if (typeof tag === "string") {
      if (tag.includes(":::")) {
        const [name, url] = tag.split(":::");
        return { name, url: url || undefined };
      }
      return { name: tag, url: undefined };
    }
    return tag;
  };

  // Helper function to convert old string array tags to new BlogTag format
  const convertTagsToNewFormat = (tags?: (BlogTag | string)[]): BlogTag[] => {
    if (!tags || tags.length === 0) return [];
    return tags.map((tag) => {
      return ensureTagFormat(tag);
    });
  };

  const initialData: BlogFormData = {
    title: blog?.title || "",
    text: blog?.text || "",
    image: blog?.image || "",
    image_file_path: blog?.image_file_path || "",
    image_file_name: blog?.image_file_name || "",
    linkTag: convertTagsToNewFormat(blog?.linkTag),
  };

  const [formData, setFormData] = useState<BlogFormData>(initialData);
  const [linkTagName, setLinkTagName] = useState("");
  const [linkTagUrl, setLinkTagUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  const handleAddLinkTag = () => {
    if (linkTagName.trim() && linkTagUrl.trim()) {
      // Check if linkTag with same name already exists
      const linkTagExists = formData.linkTag?.some(
        (tag) => tag.name === linkTagName.trim()
      );

      if (!linkTagExists) {
        setFormData((prev) => ({
          ...prev,
          linkTag: [
            ...(prev.linkTag || []),
            {
              name: linkTagName.trim(),
              url: linkTagUrl.trim() || undefined,
            },
          ],
        }));
        setLinkTagName("");
        setLinkTagUrl("");
      }
    }
  };

  const handleRemoveLinkTag = (linkTagToRemove: BlogTag) => {
    setFormData((prev) => ({
      ...prev,
      linkTag: prev.linkTag?.filter((tag) => tag.name !== linkTagToRemove.name),
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
      console.log("h");

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
    setSuccess(null);

    try {
      // Create a copy of formData to submit
      const dataToSubmit = { ...formData };

      if (blog) {
        // Update existing blog using API route
        const response = await fetch(`/api/blogs/${blog.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSubmit),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update blog");
        }

        setSuccess("ბლოგი წარმატებით განახლდა!");

        // Call onUpdate callback if provided (for edit mode)
        if (onUpdate) {
          // Call immediately, don't wait
          onUpdate();

          // Clear success message after delay
          setTimeout(() => {
            setSuccess(null);
          }, 3000);
          return; // Don't navigate since onUpdate handles refresh
        }
      } else {
        // Create new blog using API route
        const response = await fetch("/api/blogs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSubmit),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create blog");
        }

        setSuccess("ბლოგი წარმატებით შეიქმნა!");

        setTimeout(() => {
          router.push("/dashboard/blogs");
        }, 1500);
      }
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

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-200">
              {success}
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

          <div className="space-y-4">
            <Label htmlFor="linkTags">ლინკ ტეგები</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input
                  id="linkTagName"
                  value={linkTagName}
                  onChange={(e) => setLinkTagName(e.target.value)}
                  placeholder="ლინკ ტეგის სახელი"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLinkTag();
                    }
                  }}
                />
                <Input
                  id="linkTagUrl"
                  value={linkTagUrl}
                  onChange={(e) => setLinkTagUrl(e.target.value)}
                  placeholder="ლინკ ტეგის URL"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLinkTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddLinkTag}
                  variant="secondary"
                  disabled={!linkTagName.trim() || !linkTagUrl.trim()}
                >
                  <Plus size={16} />
                  დამატება
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                ლინკ ტეგები - სახელი და URL
              </p>
            </div>
            {formData.linkTag && formData.linkTag.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.linkTag.map((linkTag, index) => {
                  return (
                    <div
                      key={index}
                      className="flex items-center rounded-full text-sm gap-2 relative group"
                    >
                      {linkTag.url ? (
                        <a
                          href={linkTag.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center border px-3 py-1 rounded-full gap-2 transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          title={`ღია ლინკი: ${linkTag.url}`}
                        >
                          <span>{linkTag.name}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <div className="flex items-center border px-3 py-1 rounded-full gap-2 transition-colors bg-green-50 text-green-700 border-green-200">
                          <span>{linkTag.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveLinkTag(linkTag)}
                        className="ml-1 text-secondary-foreground/70 hover:text-secondary-foreground bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
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
