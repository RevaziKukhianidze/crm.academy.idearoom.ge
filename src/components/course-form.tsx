"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "../../supabase/client";
import { Upload, Image as ImageIcon, Plus, X, FileIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Type definitions remain the same...
export interface Course {
  id?: string;
  title: string;
  course_details: string[];
  image: string;
  image_file_path: string;
  courseIcon: string;
  start_course: string;
  quantity_lessons: number;
  quantity_of_students: string;
  lesson_time: number;
  lecturer: string;
  lecturer_details: string;
  price: number;
  oldprice: number;
  syllabus_title: string[];
  syllabus_content: string[][];
}

export interface CourseFormData extends Omit<Course, "id"> {}

interface CourseFormProps {
  course?: Course;
}

export default function CourseForm({ course }: CourseFormProps) {
  // Initialize form data (same as before)
  const initialCourseDetails = Array.isArray(course?.course_details)
    ? course.course_details
    : course?.course_details
      ? [course.course_details]
      : [""];

  const initialSyllabusTitle = Array.isArray(course?.syllabus_title)
    ? course.syllabus_title
    : [""];
  const initialSyllabusContent = Array.isArray(course?.syllabus_content)
    ? course.syllabus_content
    : [[""]];

  const initialData: CourseFormData = {
    title: course?.title || "",
    course_details: initialCourseDetails,
    image: course?.image || "",
    image_file_path: course?.image_file_path || "",
    courseIcon: course?.courseIcon || "",
    start_course: course?.start_course || "",
    quantity_lessons: course?.quantity_lessons || 0,
    quantity_of_students: course?.quantity_of_students || "",
    lesson_time: course?.lesson_time || 0,
    lecturer: course?.lecturer || "",
    lecturer_details: course?.lecturer_details || "",
    price: course?.price || 0,
    oldprice: course?.oldprice || 0,
    syllabus_title: initialSyllabusTitle,
    syllabus_content: initialSyllabusContent,
  };

  const [formData, setFormData] = useState<CourseFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [iconUploadProgress, setIconUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Input handlers remain the same...
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name !== "course_details" && !name.startsWith("syllabus_")) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? 0 : parseInt(value, 10),
    }));
  };

  // Course details handlers remain the same...
  const handleCourseDetailChange = (index: number, value: string) => {
    setFormData((prev) => {
      const updatedDetails = [...prev.course_details];
      updatedDetails[index] = value;
      return { ...prev, course_details: updatedDetails };
    });
  };

  const addCourseDetail = () => {
    setFormData((prev) => ({
      ...prev,
      course_details: [...prev.course_details, ""],
    }));
  };

  const removeCourseDetail = (index: number) => {
    setFormData((prev) => {
      const updatedDetails = [...prev.course_details];
      updatedDetails.splice(index, 1);
      if (updatedDetails.length === 0) {
        updatedDetails.push("");
      }
      return { ...prev, course_details: updatedDetails };
    });
  };

  // Syllabus handlers remain the same...
  const handleSyllabusTitleChange = (index: number, value: string) => {
    setFormData((prev) => {
      const updatedTitles = [...prev.syllabus_title];
      updatedTitles[index] = value;
      return { ...prev, syllabus_title: updatedTitles };
    });
  };

  const handleSyllabusContentChange = (
    titleIndex: number,
    contentIndex: number,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedContent = [...prev.syllabus_content];
      if (!updatedContent[titleIndex]) {
        updatedContent[titleIndex] = [""];
      }
      updatedContent[titleIndex][contentIndex] = value;
      return { ...prev, syllabus_content: updatedContent };
    });
  };

  const addSyllabusSection = () => {
    setFormData((prev) => ({
      ...prev,
      syllabus_title: [...prev.syllabus_title, ""],
      syllabus_content: [...prev.syllabus_content, [""]],
    }));
  };

  const removeSyllabusSection = (index: number) => {
    setFormData((prev) => {
      const updatedTitles = [...prev.syllabus_title];
      const updatedContent = [...prev.syllabus_content];
      updatedTitles.splice(index, 1);
      updatedContent.splice(index, 1);
      if (updatedTitles.length === 0) {
        updatedTitles.push("");
        updatedContent.push([""]);
      }
      return {
        ...prev,
        syllabus_title: updatedTitles,
        syllabus_content: updatedContent,
      };
    });
  };

  const addSyllabusContentItem = (titleIndex: number) => {
    setFormData((prev) => {
      const updatedContent = [...prev.syllabus_content];
      if (!updatedContent[titleIndex]) {
        updatedContent[titleIndex] = [""];
      }
      updatedContent[titleIndex].push("");
      return { ...prev, syllabus_content: updatedContent };
    });
  };

  const removeSyllabusContentItem = (
    titleIndex: number,
    contentIndex: number
  ) => {
    setFormData((prev) => {
      const updatedContent = [...prev.syllabus_content];
      updatedContent[titleIndex].splice(contentIndex, 1);
      if (updatedContent[titleIndex].length === 0) {
        updatedContent[titleIndex].push("");
      }
      return { ...prev, syllabus_content: updatedContent };
    });
  };

  // FIXED FILE UPLOAD FUNCTION
  const handleFileUpload = async (file: File, type: "image" | "icon") => {
    if (!file) return;

    const setProgressState =
      type === "image" ? setUploadProgress : setIconUploadProgress;

    try {
      if (type === "image") {
        setIsUploading(true);
        setUploadProgress(0);
      } else {
        setIsIconUploading(true);
        setIconUploadProgress(0);
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      const bucket = "course-images"; // Your bucket name

      // Create a simulated progress update
      const progressInterval = setInterval(() => {
        setProgressState((prev) => {
          const newProgress = prev + 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Use Supabase's upload method directly
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Set progress to 100% when done
      setProgressState(100);

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Update form data with the new image URL and path
      if (type === "image") {
        setFormData((prev) => ({
          ...prev,
          image: publicUrl,
          image_file_path: filePath,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          courseIcon: publicUrl,
        }));
      }

      // Short timeout to show 100% complete before resetting loading state
      setTimeout(() => {
        if (type === "image") {
          setIsUploading(false);
        } else {
          setIsIconUploading(false);
        }
      }, 500);
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      setError(err.message || `Failed to upload ${type}`);

      if (type === "image") {
        setIsUploading(false);
      } else {
        setIsIconUploading(false);
      }
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "icon"
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0], type);
    }
  };

  const triggerFileInput = (type: "image" | "icon") => {
    if (type === "image" && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (type === "icon" && iconInputRef.current) {
      iconInputRef.current.click();
    }
  };

  // Form submission remains the same...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare data for submission
      const dataToSubmit = {
        ...formData,
        // Remove file path properties from submission
        image_file_path: undefined,

        // Clean course details: remove empty strings
        course_details: formData.course_details.filter(
          (detail) => detail.trim() !== ""
        ),

        // Clean syllabus titles
        syllabus_title: formData.syllabus_title.filter(
          (title) => title.trim() !== ""
        ),

        // Clean syllabus content
        syllabus_content: formData.syllabus_content
          .map((contentArray) =>
            contentArray.filter((content) => content.trim() !== "")
          )
          .filter((contentArray) => contentArray.length > 0),
      };

      if (course && course.id) {
        // Update existing course
        const { error } = await supabase
          .from("courses")
          .update(dataToSubmit)
          .eq("id", course.id);

        if (error) throw error;
      } else {
        // Create new course
        const { error } = await supabase.from("courses").insert([dataToSubmit]);
        if (error) throw error;
      }

      router.push("/dashboard/courses");
      router.refresh();
    } catch (err: any) {
      console.error("Error saving course:", err);
      setError(err.message || "Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };
  // Component return remains the same...
  return (
    <Card className="bg-background">
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
              placeholder="შეიყვანეთ კურსის სათაური"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>კურსის დეტალები</Label>
            <div className="space-y-3">
              {formData.course_details.map((detail, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={detail}
                    onChange={(e) =>
                      handleCourseDetailChange(index, e.target.value)
                    }
                    placeholder="შეიყვანეთ კურსის დეტალი"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeCourseDetail(index)}
                    className="shrink-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addCourseDetail}
                className="flex items-center gap-2"
              >
                <Plus size={16} /> დეტალის დამატება
              </Button>
              <p className="text-xs text-muted-foreground">
                თითოეული ველი წარმოადგენს დეტალების მასივის ერთ ელემენტს
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="lecturer">ლექტორი</Label>
              <Input
                id="lecturer"
                name="lecturer"
                value={formData.lecturer}
                onChange={handleChange}
                placeholder="შეიყვანეთ ლექტორის სახელი"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lecturer_details">ლექტორის დეტალები</Label>
              <Input
                id="lecturer_details"
                name="lecturer_details"
                value={formData.lecturer_details}
                onChange={handleChange}
                placeholder="შეიყვანეთ ლექტორის დეტალები"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">ფასი</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleNumericChange}
                placeholder="შეიყვანეთ ფასი"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oldprice">ძველი ფასი</Label>
              <Input
                id="oldprice"
                name="oldprice"
                type="number"
                min="0"
                value={formData.oldprice}
                onChange={handleNumericChange}
                placeholder="შეიყვანეთ ძველი ფასი (არჩევითი)"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="image">კურსის სურათი</Label>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => triggerFileInput("image")}
                  disabled={isUploading}
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <Upload size={16} />
                  {isUploading ? "იტვირთება..." : "სურათის ატვირთვა"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileInputChange(e, "image")}
                />
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
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}
              {formData.image ? (
                <div className="w-full max-w-md h-60 rounded-md overflow-hidden bg-muted relative group">
                  <img
                    src={formData.image}
                    alt="Course preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/600x400?text=Invalid+Image+URL";
                    }}
                  />
                  <input type="hidden" name="image" value={formData.image} />
                </div>
              ) : (
                <div className="w-full max-w-md h-60 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-dashed border-muted-foreground/50">
                  <div className="text-muted-foreground flex flex-col items-center p-6">
                    <ImageIcon size={48} strokeWidth={1} />
                    <span className="text-sm mt-4">სურათი არ არის არჩეული</span>
                    <span className="text-xs mt-2">
                      დააჭირეთ ატვირთვას სურათის დასამატებლად
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="courseIcon">კურსის ხატულა</Label>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => triggerFileInput("icon")}
                  disabled={isIconUploading}
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <Upload size={16} />
                  {isIconUploading ? "იტვირთება..." : "ხატულის ატვირთვა"}
                </Button>
                <input
                  type="file"
                  ref={iconInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileInputChange(e, "icon")}
                />
              </div>
              {isIconUploading && (
                <div className="mt-2">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-in-out"
                      style={{ width: `${iconUploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploading: {iconUploadProgress}%
                  </p>
                </div>
              )}
              {formData.courseIcon ? (
                <div className="w-full max-w-md h-60 rounded-md overflow-hidden bg-muted relative group">
                  <img
                    src={formData.courseIcon}
                    alt="Course icon preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/600x400?text=Invalid+Icon+URL";
                    }}
                  />
                  <input
                    type="hidden"
                    name="courseIcon"
                    value={formData.courseIcon}
                  />
                </div>
              ) : (
                <div className="w-full max-w-md h-60 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-dashed border-muted-foreground/50">
                  <div className="text-muted-foreground flex flex-col items-center p-6">
                    <FileIcon size={48} strokeWidth={1} />
                    <span className="text-sm mt-4">ხატულა არ არის არჩეული</span>
                    <span className="text-xs mt-2">
                      დააჭირეთ ატვირთვას ხატულის დასამატებლად
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Syllabus Section */}
          <div className="space-y-4 border p-4 rounded-md">
            <div className="flex justify-between items-center">
              <Label>სილაბუსის სექციები</Label>
              <Button
                type="button"
                variant="outline"
                onClick={addSyllabusSection}
                className="flex items-center gap-2"
              >
                <Plus size={16} /> სექციის დამატება
              </Button>
            </div>
            {formData.syllabus_title.map((title, titleIndex) => (
              <div
                key={titleIndex}
                className="border-b pb-4 mb-4 last:border-0 last:mb-0 last:pb-0"
              >
                <div className="flex gap-2 mb-3">
                  <Input
                    value={title}
                    onChange={(e) =>
                      handleSyllabusTitleChange(titleIndex, e.target.value)
                    }
                    placeholder="შეიყვანეთ სექციის სათაური"
                    className="font-medium"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeSyllabusSection(titleIndex)}
                    className="shrink-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
                <div className="pl-4 border-l ml-2 space-y-2">
                  <Label className="text-sm">კონტენტის ელემენტები</Label>
                  {formData.syllabus_content[titleIndex]?.map(
                    (content, contentIndex) => (
                      <div key={contentIndex} className="flex gap-2">
                        <Input
                          value={content}
                          onChange={(e) =>
                            handleSyllabusContentChange(
                              titleIndex,
                              contentIndex,
                              e.target.value
                            )
                          }
                          placeholder="შეიყვანეთ კონტენტის ელემენტი"
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            removeSyllabusContentItem(titleIndex, contentIndex)
                          }
                          className="shrink-0"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    )
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSyllabusContentItem(titleIndex)}
                    className="flex items-center gap-1 mt-2"
                  >
                    <Plus size={14} /> ელემენტის დამატება
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              თითოეული სექცია შექმნის სილაბუსის სათაურს და შესაბამის კონტენტებს
              სილაბუსის მასივში
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_course">დაწყების თარიღი</Label>
              <Input
                id="start_course"
                name="start_course"
                type="text"
                value={formData.start_course || ""}
                onChange={handleChange}
                placeholder="შეიყვანეთ დაწყების თარიღი"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_lessons">გაკვეთილების რაოდენობა</Label>
              <Input
                id="quantity_lessons"
                name="quantity_lessons"
                type="number"
                min="0"
                value={formData.quantity_lessons || 0}
                onChange={handleNumericChange}
                placeholder="შეიყვანეთ გაკვეთილების რაოდენობა"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_of_students">ჯგუფის ზომა</Label>
              <Input
                id="quantity_of_students"
                name="quantity_of_students"
                value={formData.quantity_of_students || ""}
                onChange={handleChange}
                placeholder="მაგ. 5-10 სტუდენტი"
              />
              <p className="text-xs text-muted-foreground">
                შეიყვანეთ ჯგუფის ზომა ტექსტური აღწერის სახით
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson_time">
                გაკვეთილის ხანგრძლივობა (წუთები)
              </Label>
              <Input
                id="lesson_time"
                name="lesson_time"
                type="number"
                min="0"
                value={formData.lesson_time || 0}
                onChange={handleNumericChange}
                placeholder="შეიყვანეთ გაკვეთილის ხანგრძლივობა"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="px-8">
              {isSubmitting
                ? "იტვირთება..."
                : course
                  ? "კურსის განახლება"
                  : "კურსის შექმნა"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/courses")}
            >
              გაუქმება
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
