"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Link, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseItem {
  id: number;
  title: string;
}

type LinkType = "course" | "custom";

interface FormValues {
  title: string;
  text: string;
  image: string;
  course_id: string | null;
  custom_url: string; // manual course-id field (course mode only)
  link_type: LinkType;
  external_url: string; // custom slug, e.g. "summer"
}

// The slider table only has a single `button_link` column — this matches it 1:1.
interface SliderData {
  title: string | null;
  text: string | null;
  image: string | null;
  button_link: string | null;
}

interface SliderFormProps {
  sliderId?: string;
}

// ---------------------------------------------------------------------------
// Supabase browser client
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractCourseIdFromButtonLink(buttonLink: string | null): string | null {
  if (!buttonLink) return null;
  const match = buttonLink.match(/^\/courses\/(\d+)\/?$/);
  return match ? match[1] : null;
}

// Anything in button_link that is NOT a clean /courses/{id} link is treated as a
// custom route. Returns the slug without the leading slash (e.g. "/summer" -> "summer").
function extractCustomSlugFromButtonLink(buttonLink: string | null): string {
  if (!buttonLink) return "";
  if (extractCourseIdFromButtonLink(buttonLink)) return "";
  return buttonLink.replace(/^\/+/, "");
}

function findMatchingCourse(title: string, courses: CourseItem[]): CourseItem | null {
  if (!title.trim()) return null;
  const lower = title.trim().toLowerCase();

  const exact = courses.find((c) => c.title.trim().toLowerCase() === lower);
  if (exact) return exact;

  const norm = (s: string) =>
    s.toLowerCase().replace(/[\s\-_,.]+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalised = courses.find((c) => norm(c.title) === norm(title));
  if (normalised) return normalised;

  const contains = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      lower.includes(c.title.toLowerCase())
  );
  return contains.length === 1 ? contains[0] : null;
}

// Single source of truth for how a button_link is composed.
function composeButtonLink({
  linkType,
  courseId,
  slug,
}: {
  linkType: LinkType;
  courseId: number | null;
  slug: string;
}): string | null {
  if (linkType === "course") {
    return courseId ? `/courses/${courseId}` : null;
  }
  const clean = slug.trim().replace(/^\/+/, "");
  return clean ? `/${clean}` : null;
}

// ---------------------------------------------------------------------------
// Link Type Selector sub-component
// ---------------------------------------------------------------------------

function LinkTypeSelector({
  value,
  onChange,
}: {
  value: LinkType;
  onChange: (v: LinkType) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        padding: "4px",
        background: "var(--color-n120)",
        border: "1px solid var(--color-n90)",
        borderRadius: "8px",
      }}
    >
      {(
        [
          { value: "course", label: "კურსი", Icon: BookOpen },
          { value: "custom", label: "Custom Route", Icon: Link },
        ] as const
      ).map(({ value: v, label, Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: active ? 500 : 400,
              background: active ? "var(--color-n90)" : "transparent",
              color: active ? "var(--color-white)" : "var(--color-n70)",
              transition: "all 0.15s",
            }}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SliderForm({ sliderId }: SliderFormProps) {
  const router = useRouter();
  const isEditMode = !!sliderId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [matchingCourse, setMatchingCourse] = useState<CourseItem | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      text: "",
      image: "",
      course_id: null,
      custom_url: "",
      link_type: "course",
      external_url: "",
    },
  });

  const linkType = form.watch("link_type");

  // ---------------------------------------------------------------------------
  // Fetch courses
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .order("title", { ascending: true });

      if (!error && Array.isArray(data)) {
        setCourses(data);
      }
    };
    fetchCourses();
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-match course when title changes
  // ---------------------------------------------------------------------------
  const currentTitle = form.watch("title");

  useEffect(() => {
    if (linkType !== "course") return;
    const match = findMatchingCourse(currentTitle, courses);
    setMatchingCourse(match);
    form.setValue("course_id", match ? String(match.id) : null);
  }, [currentTitle, courses, linkType]);

  // ---------------------------------------------------------------------------
  // Load existing slider in edit mode
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sliderId || courses.length === 0) return;

    const fetchSliderData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/sliders/${sliderId}`);
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "სლაიდერის ჩატვირთვა ვერ მოხერხდა");
        }
        const data = await response.json();

        // Everything is derived from the single button_link column.
        const courseId = extractCourseIdFromButtonLink(data.button_link);
        const customSlug = extractCustomSlugFromButtonLink(data.button_link);
        const inferredLinkType: LinkType = courseId ? "course" : "custom";

        form.reset({
          title: data.title || "",
          text: data.text || "",
          image: data.image || "",
          course_id: courseId,
          custom_url: courseId || "", // manual id field, course mode
          link_type: inferredLinkType,
          external_url: customSlug, // custom mode slug
        });

        if (data.image) setImagePreview(data.image);

        if (data.title && inferredLinkType === "course") {
          const match = findMatchingCourse(data.title, courses);
          setMatchingCourse(match);
          if (match) form.setValue("course_id", String(match.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSliderData();
  }, [sliderId, courses]);

  // ---------------------------------------------------------------------------
  // Image handlers
  // ---------------------------------------------------------------------------
  const handleImageUrlChange = (url: string) => {
    form.setValue("image", url);
    setImagePreview(url.trim() !== "" ? url : null);
    setBase64Image(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს");
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setBase64Image(base64);
      setImagePreview(base64);
      form.setValue("image", base64);
      setUploading(false);
    };

    reader.onerror = () => {
      setError("ფაილის წაკითხვა ვერ მოხერხდა");
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let finalCourseId: number | null = null;
      let resolvedCourseName = "";

      if (data.link_type === "course") {
        // Title-match takes priority
        if (data.title?.trim()) {
          const match = findMatchingCourse(data.title, courses);
          if (match) {
            finalCourseId = match.id;
            resolvedCourseName = match.title;
          }
        }

        // Fall back to manual course ID
        if (!finalCourseId && data.custom_url?.trim()) {
          const parsed = parseInt(data.custom_url.trim());
          if (!isNaN(parsed)) {
            finalCourseId = parsed;
            const found = courses.find((c) => c.id === parsed);
            if (found) resolvedCourseName = found.title;
          }
        }
      }

      // Compose the final route — this is what actually gets stored.
      const buttonLink = composeButtonLink({
        linkType: data.link_type,
        courseId: finalCourseId,
        slug: data.external_url,
      });

      if (!data.title && !data.text && !data.image) {
        setError("გთხოვთ, შეავსოთ მინიმუმ ერთი ველი");
        setLoading(false);
        return;
      }

      const sliderData: SliderData = {
        title: data.title?.trim() || null,
        text: data.text?.trim() || null,
        image: data.image?.trim() || null,
        button_link: buttonLink,
      };

      const url = isEditMode ? `/api/sliders/${sliderId}` : "/api/sliders";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sliderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "ოპერაცია ვერ შესრულდა");
      }

      const action = isEditMode ? "განახლდა" : "შეიქმნა";
      setSuccess(
        data.link_type === "course" && resolvedCourseName
          ? `სლაიდერი ${action} და დაკავშირდა კურსთან: "${resolvedCourseName}"`
          : data.link_type === "custom" && buttonLink
            ? `სლაიდერი ${action} — ბმული: ${buttonLink}`
            : `სლაიდერი წარმატებით ${action}`
      );

      setTimeout(() => router.push("/dashboard/sliders"), 1500);
    } catch (err) {
      setError(
        `დაფიქსირდა შეცდომა: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
            {/* ── Left column ── */}
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
                    {linkType === "course" && matchingCourse ? (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ დაკავშირებულია კურსთან: "{matchingCourse.title}" (ID:{" "}
                        {matchingCourse.id})
                      </p>
                    ) : linkType === "course" && currentTitle.trim() ? (
                      <p className="text-xs text-amber-600 mt-1">
                        სათაურით კურსი ვერ მოიძებნა
                      </p>
                    ) : null}
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

              {/* ── Link section ── */}
              <div className="space-y-3">
                <FormLabel className="text-base">
                  ბმული (არასავალდებულო)
                </FormLabel>

                <FormField
                  control={form.control}
                  name="link_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LinkTypeSelector
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            // Clear the opposite field on switch
                            if (v === "course") {
                              form.setValue("external_url", "");
                            } else {
                              form.setValue("custom_url", "");
                              setMatchingCourse(null);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {linkType === "course" ? (
                  <FormField
                    control={form.control}
                    name="custom_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center">
                            <span
                              style={{
                                padding: "0 12px",
                                height: "48px",
                                display: "flex",
                                alignItems: "center",
                                background: "var(--color-n100)",
                                border: "1px solid var(--color-n90)",
                                borderRight: "none",
                                borderRadius: "6px 0 0 6px",
                                color: "var(--color-n70)",
                                fontSize: "13px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              /courses/
                            </span>
                            <Input
                              placeholder="123"
                              {...field}
                              value={field.value ?? ""}
                              className="h-12 rounded-l-none"
                              type="number"
                              min="1"
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          სათაურის ავტო-კავშირი პრიორიტეტულია. ID შეიყვანეთ
                          მხოლოდ ხელით.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="external_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center">
                            <span
                              style={{
                                padding: "0 12px",
                                height: "48px",
                                display: "flex",
                                alignItems: "center",
                                background: "var(--color-n100)",
                                border: "1px solid var(--color-n90)",
                                borderRight: "none",
                                borderRadius: "6px 0 0 6px",
                                color: "var(--color-n70)",
                                fontSize: "13px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              /
                            </span>
                            <Input
                              placeholder="summer"
                              {...field}
                              className="h-12 rounded-l-none"
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          შიდა გვერდის მისამართი — მაგ. summer, promo, sale
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* ── Right column ── */}
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
                              <p className="text-muted-foreground mt-2 text-sm">
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
                              <div className="space-y-2">
                                <Input
                                  id="image-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  disabled={uploading}
                                  className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">
                                  მაქს. 5MB · JPG, PNG, GIF
                                </p>
                              </div>
                            </TabsContent>
                            <TabsContent value="url" className="mt-4">
                              <div className="space-y-2">
                                <Input
                                  placeholder="https://example.com/image.jpg"
                                  value={base64Image ? "" : field.value}
                                  onChange={(e) =>
                                    handleImageUrlChange(e.target.value)
                                  }
                                  className="h-12"
                                  disabled={uploading}
                                />
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