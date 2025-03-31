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

// Define an offered course interface with only the properties we need
interface CourseItem {
  id: number;
  title: string;
}

interface FormValues {
  title: string;
  text: string;
  image: string;
  course_id: string | null; // Added course_id instead of button_link
}

interface SliderData {
  title: string | null;
  text: string | null;
  image: string | null;
  course_id: number | null; // Changed from button_link to course_id
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
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [matchingCourse, setMatchingCourse] = useState<CourseItem | null>(null);
  const isEditMode = !!sliderId;

  // Initialize form
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      text: "",
      image: "",
      course_id: null, // Initialize as null
    },
  });

  // Fetch courses to match with slider title
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // ✨ შევამოწმოთ თუ SUPABASE_URL და ANON_KEY არსებობს
        console.log(
          "NEXT_PUBLIC_SUPABASE_URL არსებობს:",
          !!process.env.NEXT_PUBLIC_SUPABASE_URL
        );
        console.log(
          "NEXT_PUBLIC_SUPABASE_ANON_KEY არსებობს:",
          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const supabase = await createClient();
        console.log("✨ იწყება course ცხრილიდან მონაცემების მოთხოვნა...");

        const { data, error } = await supabase
          .from("courses") // შეცვლილია: offered_course → course
          .select("id, title")
          .order("title", { ascending: true });

        if (error) {
          console.error("Error fetching courses:", error);
          return;
        }

        console.log(`✅ მოიძებნა ${data?.length || 0} კურსი:`, data);

        // დამატებითი შემოწმება - გამოვბეჭდოთ ყველა კურსის სახელი და ID
        if (data && data.length > 0) {
          console.log("კურსების სია:");
          data.forEach((course, index) => {
            console.log(
              `${index + 1}. ID: ${course.id}, სათაური: "${course.title}"`
            );
          });
        } else {
          console.log("⚠️ ყურადღება: course ცხრილში კურსები არ მოიძებნა!");
        }

        setCourses(data || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchCourses();
  }, []);

  // Watch title changes to update course_id
  const currentTitle = form.watch("title");

  useEffect(() => {
    if (currentTitle && currentTitle.trim()) {
      const trimmedTitle = currentTitle.trim();
      console.log("ამჟამინდელი სათაური:", trimmedTitle);
      console.log("სათაურის სიგრძე:", trimmedTitle.length);
      console.log(
        "სათაურის კოდი:",
        Array.from(trimmedTitle).map((c) => c.charCodeAt(0))
      );

      // Log all courses for debugging
      if (courses.length > 0) {
        console.log(`მოძიებულია ${courses.length} კურსი შესადარებლად`);
      } else {
        console.log(
          "⚠️ კურსები არ არის ხელმისაწვდომი შესადარებლად. ცხრილი ცარიელია?"
        );
      }

      // Log each comparison attempt for debugging
      let foundMatch = false;

      courses.forEach((course) => {
        const courseTitle = course.title.toLowerCase();
        const currentTitleLower = trimmedTitle.toLowerCase();

        console.log(`შედარება: "${currentTitleLower}" === "${courseTitle}"`);
        console.log(`კურსის სათაურის სიგრძე: ${courseTitle.length}`);
        console.log(`ჩემი სათაურის სიგრძე: ${currentTitleLower.length}`);

        if (courseTitle === currentTitleLower) {
          console.log("✅ ზუსტი დამთხვევა!");
          foundMatch = true;
        } else {
          // შევამოწმოთ რატომ არ ემთხვევა
          const commonLength = Math.min(
            courseTitle.length,
            currentTitleLower.length
          );
          let firstDifferenceIndex = -1;

          for (let i = 0; i < commonLength; i++) {
            if (courseTitle[i] !== currentTitleLower[i]) {
              firstDifferenceIndex = i;
              break;
            }
          }

          if (firstDifferenceIndex >= 0) {
            console.log(`განსხვავება პოზიციაზე ${firstDifferenceIndex}:`);
            console.log(
              `  კურსი: "${courseTitle[firstDifferenceIndex]}" (კოდი: ${courseTitle.charCodeAt(firstDifferenceIndex)})`
            );
            console.log(
              `  ჩემი:  "${currentTitleLower[firstDifferenceIndex]}" (კოდი: ${currentTitleLower.charCodeAt(firstDifferenceIndex)})`
            );
          } else if (courseTitle.length !== currentTitleLower.length) {
            console.log("სიგრძეები განსხვავდება.");
          }
        }
      });

      if (!foundMatch) {
        console.log("❌ კურსების გადარჩევა დასრულდა, დამთხვევა ვერ მოიძებნა");
      }

      // Look for exact match (case-insensitive)
      const matchedCourse = courses.find(
        (course) =>
          course.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
      );

      if (matchedCourse) {
        console.log("✅ ნაპოვნია ზუსტი დამთხვევა:", matchedCourse);
        setMatchingCourse(matchedCourse);
        // Set course_id when we find a match
        console.log("Setting course_id to:", matchedCourse.id);
        form.setValue("course_id", String(matchedCourse.id));
        return; // ვიპოვეთ, გამოვდივართ
      }

      // თუ ზუსტი დამთხვევა ვერ მოიძებნა, ვცადოთ ალტერნატიული მეთოდები
      console.log(
        "👀 ზუსტი დამთხვევა ვერ მოიძებნა, ვცდილობთ ალტერნატიულ მეთოდებს..."
      );

      // მეთოდი 1: შევამოწმოთ სპეციალური სიმბოლოების გარეშე
      const normalizedCurrentTitle = trimmedTitle
        .toLowerCase()
        .replace(/[\s\-_,.]+/g, "") // Remove spaces, dashes, underscores
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics

      for (const course of courses) {
        const normalizedCourseTitle = course.title
          .trim()
          .toLowerCase()
          .replace(/[\s\-_,.]+/g, "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (normalizedCourseTitle === normalizedCurrentTitle) {
          console.log("✅ ნაპოვნია დამთხვევა ნორმალიზებული მეთოდით!");
          console.log(`  კურსი: "${course.title}" (ID: ${course.id})`);

          setMatchingCourse(course);
          console.log("Setting course_id to:", course.id);
          form.setValue("course_id", String(course.id));
          return; // მოვძებნეთ, გამოვდივართ
        }
      }

      // მეთოდი 2: ვეძებთ "შეიცავს" მეთოდით
      console.log("👀 ვცდილობთ მოძიებას შეიცავს-მეთოდით...");

      const exactMatches = courses.filter(
        (course) =>
          course.title
            .trim()
            .toLowerCase()
            .includes(trimmedTitle.toLowerCase()) ||
          trimmedTitle.toLowerCase().includes(course.title.trim().toLowerCase())
      );

      if (exactMatches.length === 1) {
        // მხოლოდ ერთი დამთხვევა
        const match = exactMatches[0];
        console.log("✅ ნაპოვნია ერთი დამთხვევა შეიცავს-მეთოდით!");
        console.log(`  კურსი: "${match.title}" (ID: ${match.id})`);

        setMatchingCourse(match);
        console.log("Setting course_id to:", match.id);
        form.setValue("course_id", String(match.id));
      } else if (exactMatches.length > 1) {
        // რამდენიმე დამთხვევა
        console.log(
          `⚠️ ნაპოვნია ${exactMatches.length} დამთხვევა - ვერ ვადგენთ რომელია სწორი:`
        );
        exactMatches.forEach((match, idx) => {
          console.log(`  ${idx + 1}. "${match.title}" (ID: ${match.id})`);
        });
      } else {
        console.log("❌ ვერც ერთი მეთოდით ვერ მოიძებნა შესაბამისი კურსი");
        setMatchingCourse(null);
        // Clear course_id if no match is found
        form.setValue("course_id", null);
      }
    } else {
      // Clear if title is empty
      setMatchingCourse(null);
      form.setValue("course_id", null);
    }
  }, [currentTitle, courses, form]);

  // Fetch slider data if in edit mode
  useEffect(() => {
    if (sliderId && courses.length > 0) {
      const fetchSliderData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/sliders/${sliderId}`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch slider data");
          }

          const data = await response.json();
          console.log("Fetched slider data:", data);

          if (data) {
            // Check if there's a button_link that contains a course ID
            let courseId = null;

            if (data.button_link) {
              // Handle both old and new formats
              if (data.button_link.startsWith("/offers/")) {
                // Old format: /offers/{id}
                const matches = data.button_link.match(/\/offers\/(\d+)/);
                if (matches && matches[1]) {
                  courseId = matches[1];
                  console.log(
                    "Extracted course ID from old button_link format:",
                    courseId
                  );
                }
              } else if (data.button_link.startsWith("/offer/")) {
                // Old format: /offer/{id}
                const matches = data.button_link.match(/\/offer\/(\d+)/);
                if (matches && matches[1]) {
                  courseId = matches[1];
                  console.log(
                    "Extracted course ID from old button_link format:",
                    courseId
                  );
                }
              } else if (data.button_link.startsWith("/courses/")) {
                // New format: /courses/{id}
                const matches = data.button_link.match(/\/courses\/(\d+)/);
                if (matches && matches[1]) {
                  courseId = matches[1];
                  console.log(
                    "Extracted course ID from button_link:",
                    courseId
                  );
                }
              }
            }

            // First reset form with fetched data
            form.reset({
              title: data.title || "",
              text: data.text || "",
              image: data.image || "",
              course_id: courseId,
            });

            if (data.image) {
              setImagePreview(data.image);
            }

            // Then explicitly check for a match with the current title
            if (data.title) {
              const matchedCourse = courses.find(
                (course) =>
                  course.title.toLowerCase() === data.title.toLowerCase()
              );

              if (matchedCourse) {
                console.log(
                  "Found matching course for existing slider:",
                  matchedCourse
                );
                setMatchingCourse(matchedCourse);
                // ALWAYS update course_id based on matched course
                console.log(
                  "Setting course_id for existing slider to:",
                  matchedCourse.id
                );
                form.setValue("course_id", String(matchedCourse.id));
              } else {
                console.log(
                  "No matching course found for existing slider with title:",
                  data.title
                );
                setMatchingCourse(null);
              }
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
  }, [sliderId, form, courses]);

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
      // ✨ სპეციალური შემოწმება - ჯერ დავრწმუნდეთ, რომ კურსი ნაპოვნია
      let finalCourseId: number | null = null;
      let foundMatch = false;
      let matchedCourseName = "";

      console.log("🔍 შემოწმება: მიმდინარეობს matched course-ის ძიება...");

      if (data.title && data.title.trim()) {
        // ✨ ვიპოვოთ კურსი ზუსტი (case-insensitive) დამთხვევით
        const matchedCourse = courses.find(
          (course) =>
            course.title.toLowerCase() === data.title.trim().toLowerCase()
        );

        if (matchedCourse) {
          finalCourseId = matchedCourse.id;
          foundMatch = true;
          matchedCourseName = matchedCourse.title;

          // ახალი ფორმატი: /courses/{id}
          const newLink = `/courses/${matchedCourse.id}`;

          console.log("✅ კურსი ნაპოვნია:", {
            title: matchedCourse.title,
            id: matchedCourse.id,
            link: newLink,
          });

          // ✨ ვადასტურებთ, რომ course_id დაყენებულია
          form.setValue("course_id", String(matchedCourse.id));
        } else {
          console.log("❌ სათაურით კურსი ვერ მოიძებნა:", data.title.trim());
          finalCourseId = null;
          form.setValue("course_id", null);
        }
      } else if (data.course_id) {
        // თუ course_id უკვე დაყენებულია, მაგრამ სათაური არ ემთხვევა
        finalCourseId = parseInt(data.course_id);

        // ✨ ვადასტურებთ რომ course_id ვალიდურია
        const validCourse = courses.find(
          (course) => course.id === finalCourseId
        );
        if (validCourse) {
          foundMatch = true;
          matchedCourseName = validCourse.title;
          console.log("✅ კურსი ნაპოვნია ID-ით:", {
            id: finalCourseId,
            title: validCourse.title,
          });
        } else {
          console.log(
            "⚠️ გამოყენებული course_id ვერ მოიძებნა ბაზაში:",
            finalCourseId
          );
        }
      }

      // საბოლოო შემოწმება - კონფირმაცია მომხმარებლისთვის
      if (foundMatch) {
        console.log(
          `✅ დადასტურებული კავშირი: "${matchedCourseName}" (ID: ${finalCourseId})`
        );
      } else {
        console.log("❌ კურსთან კავშირი ვერ მოიძებნა");
      }

      // Create the data object to submit
      const sliderData: SliderData = {
        title: data.title.trim() || null,
        text: data.text.trim() || null,
        image: data.image.trim() || null,
        course_id: finalCourseId,
      };

      // LOG EVERYTHING FOR DEBUGGING
      console.log("📦 მონაცემები გასაგზავნად:");
      console.log(JSON.stringify(sliderData, null, 2));
      console.log("course_id მნიშვნელობა:", sliderData.course_id);
      console.log("course_id ტიპი:", typeof sliderData.course_id);

      // Make sure at least one field has a non-null value
      if (!sliderData.title && !sliderData.text && !sliderData.image) {
        setError("გთხოვთ, შეავსოთ მინიმუმ ერთი ველი");
        setLoading(false);
        return;
      }

      let response;
      const jsonData = JSON.stringify(sliderData);
      console.log("🚀 საბოლოო მონაცემები სერვერზე გასაგზავნად:", jsonData);

      // ✨ წარმატების შემთხვევაში გამოვაჩინოთ კურსის კავშირის ინფორმაცია
      const successMessage = foundMatch
        ? `სლაიდერი ${isEditMode ? "განახლდა" : "შეიქმნა"} და დაკავშირდა კურსთან: "${matchedCourseName}"`
        : isEditMode
          ? "სლაიდერი წარმატებით განახლდა"
          : "სლაიდერი წარმატებით შეიქმნა";

      if (isEditMode && sliderId) {
        console.log(`🔄 მიმდინარეობს სლაიდერის განახლება ID-ით: ${sliderId}`);
        response = await fetch(`/api/sliders/${sliderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: jsonData,
        });
      } else {
        console.log("➕ მიმდინარეობს ახალი სლაიდერის შექმნა");
        response = await fetch("/api/sliders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonData,
        });
      }

      const responseText = await response.text();
      console.log("📥 API-ის პასუხი:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log("📊 API-ის პასუხის მონაცემები:", result);

        // ✨ შევამოწმოთ button_link API-ის პასუხში
        if (result && result.button_link) {
          console.log(
            "✅ API-ის პასუხში button_link დაფიქსირდა:",
            result.button_link
          );

          // ვამოწმებთ არის თუ არა სწორი ფორმატი
          if (result.button_link.startsWith("/courses/")) {
            console.log("✅ ბმული სწორი ფორმატისაა: ", result.button_link);
          } else if (
            result.button_link.startsWith("/offer/") ||
            result.button_link.startsWith("/offers/")
          ) {
            console.log(
              "⚠️ ბმული ძველი ფორმატისაა, სასურველია განახლდეს: ",
              result.button_link
            );
          }
        } else {
          console.log("⚠️ API-ის პასუხში button_link ვერ მოიძებნა!");
        }
      } catch (e) {
        console.error("❌ API-ის პასუხის დამუშავება ვერ მოხერხდა:", e);
        throw new Error("Unexpected response from server");
      }

      if (!response.ok) {
        throw new Error(result.error || "Operation failed");
      }

      if (result.partialSuccess) {
        setSuccess("სლაიდერი შეიქმნა, მაგრამ სურათის დამატება ვერ მოხერხდა");
      } else {
        setSuccess(successMessage);
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
                    {matchingCourse ? (
                      <p className="text-xs text-green-600 mt-1">
                        დაკავშირებულია კურსთან: "{matchingCourse.title}" (ID:{" "}
                        {matchingCourse.id})
                      </p>
                    ) : currentTitle.trim() ? (
                      <p className="text-xs text-amber-600 mt-1">
                        არ მოიძებნა კურსი სათაურით: "{currentTitle.trim()}"
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
