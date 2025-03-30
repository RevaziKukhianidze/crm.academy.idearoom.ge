"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/server";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage as CustomFormMessage } from "@/components/form-message";
import { SliderItem } from "./slider-table";
// Import the required packages once they're installed
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormValues {
  title: string;
  text: string;
  image: string;
  button_link: string;
}

interface SliderData {
  title: string | null;
  text: string | null;
  image: string | null;
  button_link: string | null;
}

interface SliderFormProps {
  sliderId?: string;
}

export default function SliderForm({ sliderId }: SliderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const isEditMode = !!sliderId;

  // Check Supabase configuration
  useEffect(() => {
    // Debug Supabase configuration
    console.log(
      "Supabase URL defined:",
      !!process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    console.log(
      "Supabase Anon Key defined:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Check if we're logged in with Supabase (might help with RLS issues)
    const checkAuth = async () => {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getSession();
        console.log("Auth session exists:", !!data.session);
        if (error) {
          console.error("Auth error:", error);
        }
        if (!data.session) {
          console.warn(
            "No authenticated session found - this may cause RLS policy violations"
          );
        }
      } catch (e) {
        console.error("Error checking auth:", e);
      }
    };

    checkAuth();
  }, []);

  // Initialize form
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      text: "",
      image: "",
      button_link: "",
    },
  });

  // Fetch slider data if in edit mode
  useEffect(() => {
    if (sliderId) {
      const fetchSliderData = async () => {
        setLoading(true);
        try {
          // Use the API endpoint instead of direct Supabase call
          const response = await fetch(`/api/sliders/${sliderId}`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch slider data");
          }

          const data = await response.json();

          if (data) {
            form.reset({
              title: data.title || "",
              text: data.text || "",
              image: data.image || "",
              button_link: data.button_link || "",
            });
            if (data.image) {
              setImagePreview(data.image);
            }
          }
        } catch (err) {
          console.error("Error fetching slider:", err);
          setError("სლაიდერის მონაცემების ჩატვირთვა ვერ მოხერხდა");
        } finally {
          setLoading(false);
        }
      };

      fetchSliderData();
    }
  }, [sliderId, form]);

  // Handle manual image URL entry with preview
  const handleImageUrlChange = (url: string) => {
    form.setValue("image", url);
    setImagePreview(url.trim() !== "" ? url : null);
    setBase64Image(null);
  };

  // Handle direct file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log(
      `File selected: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    );

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს");
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        const base64 = e.target.result as string;
        console.log(
          `File converted to base64, length: ${base64.length} characters`
        );

        // If the base64 string is very large, it could cause issues
        if (base64.length > 1024 * 1024) {
          // If over 1MB in text form
          console.warn(
            "Base64 image is very large, this might cause issues with the database"
          );
        }

        setBase64Image(base64);
        setImagePreview(base64);
        form.setValue("image", base64);
        setUploading(false);
      }
    };

    reader.onerror = (e) => {
      console.error("File reader error:", e);
      setError("ფაილის წაკითხვა ვერ მოხერხდა");
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create a properly typed object structure for submitting
      const sliderData: SliderData = {
        title: data.title.trim() || null,
        text: data.text.trim() || null,
        image: data.image.trim() || null,
        button_link: data.button_link.trim() || null,
      };

      // Debug log the data being submitted
      console.log("Submitting slider data with keys:", Object.keys(sliderData));
      console.log("Title:", sliderData.title);
      console.log("Text:", sliderData.text);
      console.log("Button link:", sliderData.button_link);
      console.log("Image provided:", !!sliderData.image);

      if (sliderData.image) {
        console.log(`Image data length: ${sliderData.image.length} characters`);
      }

      // Make sure at least one field has a non-null value
      if (
        !sliderData.title &&
        !sliderData.text &&
        !sliderData.image &&
        !sliderData.button_link
      ) {
        setError("გთხოვთ, შეავსოთ მინიმუმ ერთი ველი");
        setLoading(false);
        return;
      }

      let response;

      if (isEditMode && sliderId) {
        // Update existing slider using the API endpoint
        console.log("Updating existing slider with ID:", sliderId);
        response = await fetch(`/api/sliders/${sliderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sliderData),
        });
      } else {
        // Create new slider using the API endpoint
        console.log("Creating new slider using API endpoint");
        response = await fetch("/api/sliders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sliderData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Operation failed");
      }

      const result = await response.json();

      if (result.partialSuccess) {
        console.log("Partial success:", result);
        setSuccess("სლაიდერი შეიქმნა, მაგრამ სურათის დამატება ვერ მოხერხდა");
      } else {
        console.log("Success:", result);
        setSuccess(
          isEditMode
            ? "სლაიდერი წარმატებით განახლდა"
            : "სლაიდერი წარმატებით შეიქმნა"
        );
      }

      setTimeout(() => {
        router.push("/dashboard/sliders");
      }, 1500);
    } catch (err) {
      console.error("Error during slider submission:", err);
      setError(
        `დაფიქსირდა შეცდომა: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-sm p-8">
      {error && (
        <div className="text-red-500 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 mb-6 rounded-r-md">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-500 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 mb-6 rounded-r-md">
          {success}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      სათაური (არასავალდებულო)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="შეიყვანეთ სათაური"
                        {...field}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      ტექსტი (არასავალდებულო)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="შეიყვანეთ ტექსტი"
                        className="min-h-[150px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="button_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      ღილაკის ბმული (არასავალდებულო)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="შეიყვანეთ ღილაკის ბმული"
                        {...field}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      სურათი (არასავალდებულო)
                    </FormLabel>
                    <Card className="border-dashed">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center gap-4">
                          {imagePreview ? (
                            <div className="relative w-full h-[200px] overflow-hidden rounded-md">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setImagePreview(null);
                                    setBase64Image(null);
                                    field.onChange("");
                                  }}
                                >
                                  სურათის წაშლა
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-[200px] bg-muted/20 flex flex-col items-center justify-center rounded-md">
                              <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
                              <p className="text-muted-foreground mt-2">
                                აირჩიეთ ან ატვირთეთ სურათი
                              </p>
                            </div>
                          )}

                          <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="upload">ატვირთვა</TabsTrigger>
                              <TabsTrigger value="url">URL ბმული</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="mt-4">
                              <div className="space-y-4">
                                <Input
                                  id="image-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  disabled={uploading}
                                  className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">
                                  მაქსიმალური ზომა: 5MB. მხარდაჭერილი ფორმატები:
                                  JPG, PNG, GIF
                                </p>
                              </div>
                            </TabsContent>
                            <TabsContent value="url" className="mt-4">
                              <div className="space-y-2">
                                <Input
                                  placeholder="შეიყვანეთ სურათის URL"
                                  value={base64Image ? "" : field.value}
                                  onChange={(e) =>
                                    handleImageUrlChange(e.target.value)
                                  }
                                  className="h-12"
                                  disabled={uploading}
                                />
                                <p className="text-xs text-muted-foreground">
                                  მაგ: https://example.com/image.jpg
                                </p>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </CardContent>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/sliders")}
              disabled={loading || uploading}
              className="px-6 h-12"
            >
              გაუქმება
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="px-6 h-12"
            >
              {loading || uploading
                ? "იტვირთება..."
                : isEditMode
                  ? "განახლება"
                  : "შექმნა"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
