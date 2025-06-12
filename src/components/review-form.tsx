"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Review, ReviewFormData } from "@/types/review";
import { supabase } from "../../supabase/client";
import { Upload, Image as ImageIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ReviewFormProps {
  review?: Review;
}

export default function ReviewForm({ review }: ReviewFormProps) {
  const initialFormData: ReviewFormData = {
    text: review?.text || "",
    fullName: review?.fullName || "",
    course: review?.course || "",
    courseLink: review?.courseLink || "",
    student_picture: review?.student_picture || "",
  };

  const [formData, setFormData] = useState<ReviewFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isValidatingCourse, setIsValidatingCourse] = useState(false);
  const [courseValidationResult, setCourseValidationResult] = useState<{
    isValid: boolean;
    courseId?: number;
    message?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Fetch available courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, title")
          .order("title");

        if (!error && data) {
          setAvailableCourses(data);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchCourses();
  }, []);

  // Validate course and generate URL when course name changes
  const validateAndGenerateCourseLink = async (courseName: string) => {
    if (!courseName.trim()) {
      setCourseValidationResult(null);
      setFormData((prev) => ({ ...prev, courseLink: "" }));
      return;
    }

    setIsValidatingCourse(true);
    setCourseValidationResult(null);

    try {
      // Find matching course (case insensitive)
      const matchingCourse = availableCourses.find(
        (course) => course.title.toLowerCase() === courseName.toLowerCase()
      );

      if (matchingCourse) {
        // Generate URL with academy.idearoom.ge
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "https://academy.idearoom.ge";
        const courseUrl = `${baseUrl}/courses/${matchingCourse.id}`;

        setCourseValidationResult({
          isValid: true,
          courseId: matchingCourse.id,
          message: "კურსი ნაპოვნია ✓",
        });

        // Auto-generate the course link
        setFormData((prev) => ({
          ...prev,
          courseLink: courseUrl,
        }));
      } else {
        setCourseValidationResult({
          isValid: false,
          message:
            "კურსი ვერ მოიძებნა. შეამოწმეთ სახელი ან შექმენით ახალი კურსი.",
        });

        // Don't clear the courseLink, let user decide
      }
    } catch (error) {
      console.error("Error validating course:", error);
      setCourseValidationResult({
        isValid: false,
        message: "კურსის შემოწმებისას მოხდა შეცდომა",
      });
    } finally {
      setIsValidatingCourse(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If course field changes, validate and generate link
    if (name === "course") {
      // Debounce the validation to avoid too many API calls
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        validateAndGenerateCourseLink(value);
      }, 500);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // First try to convert to base64 (most reliable)
      const reader = new FileReader();

      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        // Try to upload to Supabase first, if fails use base64
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `review-pictures/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("review-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: true,
            });

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("review-images").getPublicUrl(filePath);

            setFormData((prev) => ({
              ...prev,
              student_picture: publicUrl,
            }));
          } else {
            // Use base64 as fallback
            setFormData((prev) => ({
              ...prev,
              student_picture: base64,
            }));
          }
        } catch (uploadErr) {
          // Use base64 as fallback
          setFormData((prev) => ({
            ...prev,
            student_picture: base64,
          }));
        }

        setUploadProgress(100);
      };

      reader.onerror = () => {
        setError("ფაილის წაკითხვისას მოხდა შეცდომა");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("ფაილის ატვირთვისას მოხდა შეცდომა");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateForm = () => {
    if (!formData.text.trim()) {
      setError("შეფასების ტექსტი აუცილებელია");
      return false;
    }
    if (!formData.fullName.trim()) {
      setError("სტუდენტის სახელი აუცილებელია");
      return false;
    }
    if (!formData.course.trim()) {
      setError("კურსის დასახელება აუცილებელია");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      if (review) {
        // Update existing review
        result = await supabase
          .from("review")
          .update({
            text: formData.text,
            fullName: formData.fullName,
            course: formData.course,
            courseLink: formData.courseLink,
            student_picture: formData.student_picture,
          })
          .eq("id", review.id);
      } else {
        // Create new review
        result = await supabase.from("review").insert([
          {
            text: formData.text,
            fullName: formData.fullName,
            course: formData.course,
            courseLink: formData.courseLink,
            student_picture: formData.student_picture,
          },
        ]);
      }

      if (result.error) {
        throw result.error;
      }

      router.push("/dashboard/reviews");
    } catch (error) {
      console.error("Error submitting review:", error);
      setError("შეფასების შენახვისას მოხდა შეცდომა");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">სტუდენტის სახელი *</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="სტუდენტის სრული სახელი"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">კურსი *</Label>
            <div className="relative">
              <Input
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="კურსის დასახელება"
                required
                list="available-courses"
              />
              <datalist id="available-courses">
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.title} />
                ))}
              </datalist>
              {isValidatingCourse && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {courseValidationResult && (
              <p
                className={`text-sm ${
                  courseValidationResult.isValid
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {courseValidationResult.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseLink">
              კურსის ლინკი
              {courseValidationResult?.isValid && (
                <span className="text-green-600 text-sm ml-2">
                  (ავტომატურად შექმნილი)
                </span>
              )}
            </Label>
            <Input
              id="courseLink"
              name="courseLink"
              value={formData.courseLink}
              onChange={handleChange}
              placeholder="https://academy.idearoom.ge/courses/..."
              className={
                courseValidationResult?.isValid
                  ? "border-green-300 bg-green-50"
                  : ""
              }
            />
            {courseValidationResult?.isValid && (
              <p className="text-xs text-gray-600">
                ლინკი ავტომატურად შეიქმნა არსებული კურსისთვის. შეგიძლიათ ხელით
                შეცვალოთ საჭიროების შემთხვევაში.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">შეფასების ტექსტი *</Label>
            <Textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="შეიყვანეთ შეფასების ტექსტი..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>სტუდენტის სურათი</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    ატვირთვა ({uploadProgress}%)
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    სურათის ატვირთვა
                  </>
                )}
              </Button>
              {formData.student_picture && (
                <div className="flex items-center gap-2">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <img
                      src={formData.student_picture}
                      alt="სტუდენტის სურათი"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, student_picture: "" }))
                    }
                  >
                    წაშლა
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/reviews")}
              disabled={isSubmitting}
            >
              გაუქმება
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting
                ? "იშლება..."
                : review
                  ? "შეფასების განახლება"
                  : "შეფასების შექმნა"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
