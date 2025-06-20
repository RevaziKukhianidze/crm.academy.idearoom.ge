"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { OfferedCourse, OfferedCourseFormData } from "@/types/offered-course";
import { supabase } from "../../supabase/client";
import { Upload, Image as ImageIcon, Plus, X, FileIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

interface OfferedCourseFormProps {
  course?: OfferedCourse;
  onUpdate?: () => void;
}

export default function OfferedCourseForm({
  course,
  onUpdate,
}: OfferedCourseFormProps) {
  // Initialize form data
  const initialCourseDetails = Array.isArray(course?.course_details)
    ? course.course_details
    : [""];

  const initialLecturers = Array.isArray(course?.lecturers)
    ? course.lecturers
    : [""];

  const initialLecturersDetails = Array.isArray(course?.lecturers_details)
    ? course.lecturers_details
    : [""];

  const initialSyllabusTitle = Array.isArray(course?.syllabus_title)
    ? course.syllabus_title
    : [""];

  const initialCourseCategory = Array.isArray(course?.course_category)
    ? course.course_category
    : [""];

  const initialFormData: OfferedCourseFormData = {
    title: course?.title || "",
    image: course?.image || "",
    lecturers: initialLecturers,
    lecturers_details: initialLecturersDetails,
    course_details: initialCourseDetails,
    quantity_of_lessons: course?.quantity_of_lessons || "",
    quantity_of_students: course?.quantity_of_students || "",
    price: course?.price || 0,
    old_price: course?.old_price || 0,
    syllabus_title: initialSyllabusTitle,
    syllabus_content: course?.syllabus_content || [[""]],
    courseIcon: course?.courseIcon || "",
    text: course?.text || "",
    course_category: initialCourseCategory,
    discount_percentage: course?.discount_percentage || "",
    lesson_time: course?.lesson_time || "",
    start_course: course?.start_course || "",
    section_image: course?.section_image || "",
  };

  const [formData, setFormData] =
    useState<OfferedCourseFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isIconUploading, setIsIconUploading] = useState(false);
  const [isSectionUploading, setIsSectionUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [iconUploadProgress, setIconUploadProgress] = useState(0);
  const [sectionUploadProgress, setSectionUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Basic input handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Handle special fields
    if (
      !name.startsWith("course_details") &&
      !name.startsWith("lecturers") &&
      !name.startsWith("lecturers_details") &&
      !name.startsWith("syllabus_title") &&
      !name.startsWith("course_category")
    ) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValue = value === "" ? 0 : parseFloat(value);

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: newValue };

      // Calculate discount percentage automatically if both prices are set
      if (
        (name === "price" || name === "old_price") &&
        typeof updatedData.old_price === "number" &&
        updatedData.old_price > 0 &&
        typeof updatedData.price === "number" &&
        updatedData.price > 0
      ) {
        const oldPrice = updatedData.old_price;
        const currentPrice = updatedData.price;

        if (oldPrice > currentPrice) {
          // Calculate discount percentage and round to nearest integer
          const discountPercentage = Math.round(
            ((oldPrice - currentPrice) / oldPrice) * 100
          );
          updatedData.discount_percentage = discountPercentage.toString();
        } else {
          // If current price is higher than old price, clear discount
          updatedData.discount_percentage = "";
        }
      }

      return updatedData;
    });
  };

  // Array field handlers
  const handleArrayChange = (
    arrayName: string,
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedArray = [
        ...(prev[arrayName as keyof OfferedCourseFormData] as string[]),
      ];
      updatedArray[index] = value;
      return { ...prev, [arrayName]: updatedArray };
    });
  };

  const addArrayItem = (arrayName: string) => {
    setFormData((prev) => {
      const currentArray = [
        ...(prev[arrayName as keyof OfferedCourseFormData] as string[]),
      ];
      return { ...prev, [arrayName]: [...currentArray, ""] };
    });
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    setFormData((prev) => {
      const currentArray = [
        ...(prev[arrayName as keyof OfferedCourseFormData] as string[]),
      ];
      currentArray.splice(index, 1);

      // Make sure the array is never empty
      if (currentArray.length === 0) {
        currentArray.push("");
      }

      return { ...prev, [arrayName]: currentArray };
    });
  };

  // Syllabus content handler
  const handleSyllabusContentChange = (
    titleIndex: number,
    contentIndex: number,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedContent = [...prev.syllabus_content];

      // Initialize the array for this title if it doesn't exist
      if (!updatedContent[titleIndex]) {
        updatedContent[titleIndex] = [];
      }

      // Update the content
      updatedContent[titleIndex][contentIndex] = value;

      return { ...prev, syllabus_content: updatedContent };
    });
  };

  const addSyllabusContentItem = (titleIndex: number) => {
    setFormData((prev) => {
      const updatedContent = [...prev.syllabus_content];

      // Initialize if needed
      if (!updatedContent[titleIndex]) {
        updatedContent[titleIndex] = [];
      }

      // Add a new empty item
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

      if (
        updatedContent[titleIndex] &&
        updatedContent[titleIndex].length > contentIndex
      ) {
        // Remove the item at contentIndex
        updatedContent[titleIndex].splice(contentIndex, 1);

        // If empty, add a default item
        if (updatedContent[titleIndex].length === 0) {
          updatedContent[titleIndex] = [""];
        }
      }

      return { ...prev, syllabus_content: updatedContent };
    });
  };

  // Update syllabus content when syllabus titles change
  useEffect(() => {
    setFormData((prev) => {
      const updatedContent = [...prev.syllabus_content];

      // Ensure each title has a corresponding content array
      prev.syllabus_title.forEach((_, index) => {
        if (!updatedContent[index]) {
          updatedContent[index] = [""];
        }
      });

      // Trim excess content arrays if titles were removed
      if (updatedContent.length > prev.syllabus_title.length) {
        updatedContent.length = prev.syllabus_title.length;
      }

      return { ...prev, syllabus_content: updatedContent };
    });
  }, [formData.syllabus_title]);

  // Calculate discount percentage on initial load and when prices change
  useEffect(() => {
    if (
      typeof formData.old_price === "number" &&
      formData.old_price > 0 &&
      typeof formData.price === "number" &&
      formData.price > 0
    ) {
      const oldPrice = formData.old_price;
      const currentPrice = formData.price;

      if (oldPrice > currentPrice) {
        // Calculate discount percentage and round to nearest integer
        const discountPercentage = Math.round(
          ((oldPrice - currentPrice) / oldPrice) * 100
        );

        // Only update if different to avoid infinite loop
        if (formData.discount_percentage !== discountPercentage.toString()) {
          setFormData((prev) => ({
            ...prev,
            discount_percentage: discountPercentage.toString(),
          }));
        }
      }
    }
  }, [formData.old_price, formData.price]);

  // File upload handlers
  const handleFileUpload = async (
    file: File,
    type: "image" | "icon" | "section"
  ) => {
    if (!file) return;

    try {
      if (type === "image") {
        setIsUploading(true);
        setUploadProgress(10); // Show some initial progress
      } else if (type === "icon") {
        setIsIconUploading(true);
        setIconUploadProgress(10);
      } else {
        setIsSectionUploading(true);
        setSectionUploadProgress(10);
      }

      // Try to do a direct file upload first
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const folder = type === "section" ? "offers-section" : "offers";
        const filePath = `${folder}/${fileName}`;

        console.log(`Starting upload to public bucket, file: ${filePath}`);

        const { data, error: uploadError } = await supabase.storage
          .from("public")
          .upload(filePath, file, {
            cacheControl: "31536000", // Increase cache time (1 year)
            upsert: true, // Always override if file exists to avoid conflicts
          });

        if (uploadError) {
          console.error(`Error uploading ${type}:`, uploadError);
          console.error(
            `Storage error details: ${JSON.stringify({
              message: uploadError.message,
              name: uploadError.name,
            })}`
          );
          throw uploadError;
        }

        if (!data) {
          console.error(`No data returned after uploading ${type}`);
          throw new Error("Upload successful but no file path returned");
        }

        console.log(`${type} uploaded successfully, path: ${data.path}`);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("public")
          .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
          throw new Error(`Failed to get public URL for ${filePath}`);
        }

        console.log(`Public URL obtained: ${urlData.publicUrl}`);

        // Update form data
        if (type === "image") {
          setFormData((prev) => ({ ...prev, image: urlData.publicUrl }));
          setUploadProgress(100);
        } else if (type === "icon") {
          setFormData((prev) => ({ ...prev, courseIcon: urlData.publicUrl }));
          setIconUploadProgress(100);
        } else {
          setFormData((prev) => ({
            ...prev,
            section_image: urlData.publicUrl,
          }));
          setSectionUploadProgress(100);
        }

        return; // Exit if successful
      } catch (storageError) {
        console.error(
          `Storage upload failed, trying base64 fallback: ${storageError}`
        );
        // If storage fails, fall back to base64
      }

      // Fallback to base64 encoding
      console.log(`Using base64 fallback for ${type}`);

      // Update progress
      if (type === "image") {
        setUploadProgress(40);
      } else if (type === "icon") {
        setIconUploadProgress(40);
      } else {
        setSectionUploadProgress(40);
      }

      // Read the file as base64
      const reader = new FileReader();

      // Create a promise to handle the FileReader
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
      });

      reader.readAsDataURL(file);

      // Wait for the file to be read
      const base64data = await base64Promise;

      // Update progress
      if (type === "image") {
        setUploadProgress(90);
      } else if (type === "icon") {
        setIconUploadProgress(90);
      } else {
        setSectionUploadProgress(90);
      }

      console.log(`Base64 encoding successful, length: ${base64data.length}`);

      // Update form data with base64
      if (type === "image") {
        setFormData((prev) => ({ ...prev, image: base64data }));
        setUploadProgress(100);
      } else if (type === "icon") {
        setFormData((prev) => ({ ...prev, courseIcon: base64data }));
        setIconUploadProgress(100);
      } else {
        setFormData((prev) => ({ ...prev, section_image: base64data }));
        setSectionUploadProgress(100);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(
        `Failed to upload ${type}. Please try again. Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setTimeout(() => {
        if (type === "image") {
          setIsUploading(false);
          setUploadProgress(0);
        } else if (type === "icon") {
          setIsIconUploading(false);
          setIconUploadProgress(0);
        } else {
          setIsSectionUploading(false);
          setSectionUploadProgress(0);
        }
      }, 1000); // Keep progress bar for a moment for feedback
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "icon" | "section"
  ) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0], type);
    }
  };

  const triggerFileInput = (type: "image" | "icon" | "section") => {
    if (type === "image" && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (type === "icon" && iconInputRef.current) {
      iconInputRef.current.click();
    } else if (type === "section" && sectionInputRef.current) {
      sectionInputRef.current.click();
    }
  };

  // Form validation
  const validateForm = () => {
    // Basic validation
    if (!formData.title) {
      return "კურსის სათაური აუცილებელია";
    }

    if (typeof formData.price !== "number" || formData.price <= 0) {
      return "მიუთითეთ სწორი ფასი";
    }

    if (!formData.quantity_of_lessons) {
      return "გაკვეთილების რაოდენობა აუცილებელია";
    }

    // Syllabus validation
    if (!formData.syllabus_title.some((title) => title.trim() !== "")) {
      return "მინიმუმ ერთი სილაბუსის სათაური აუცილებელია";
    }

    // All validations passed
    return null;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      const validationErrors = validateForm();
      if (validationErrors) {
        setError(validationErrors);
        setIsSubmitting(false);
        return;
      }

      // Create a sanitized copy of the form data
      const sanitizedFormData = { ...formData };

      // Keep only non-empty syllabus titles and their content
      const updatedSyllabusTitle = sanitizedFormData.syllabus_title.filter(
        (title) => title.trim() !== ""
      );

      // Keep only the content for titles that exist
      const updatedSyllabusContent = [...sanitizedFormData.syllabus_content];

      // Clean up empty array elements
      for (let i = 0; i < updatedSyllabusContent.length; i++) {
        if (updatedSyllabusContent[i]) {
          // Filter out empty items in each inner array
          updatedSyllabusContent[i] = updatedSyllabusContent[i].filter(
            (item) => item.trim() !== ""
          );
          // If the inner array is empty after filtering, add a placeholder
          if (updatedSyllabusContent[i].length === 0) {
            updatedSyllabusContent[i] = [""];
          }
        }
      }

      // Assign back the cleaned arrays
      sanitizedFormData.syllabus_title = updatedSyllabusTitle;
      sanitizedFormData.syllabus_content = updatedSyllabusContent;

      // Use API to save the data
      const apiUrl = course?.id
        ? `/api/offered-courses/${course.id}`
        : "/api/offered-courses";

      const response = await fetch(apiUrl, {
        method: course?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "შეთავაზების შენახვა ვერ მოხერხდა");
      }

      // Handle successful submission
      if (onUpdate) {
        // Call onUpdate callback if provided (for edit mode with refresh)
        onUpdate();
      } else {
        // Redirect to offers page if no callback provided
        router.push("/dashboard/offers");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setError(
        err instanceof Error ? err.message : "შეთავაზების შენახვა ვერ მოხერხდა"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">სათაური</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="შეიყვანეთ სათაური"
                  required
                />
              </div>

              <div>
                <Label htmlFor="text">ტექსტი</Label>
                <Textarea
                  id="text"
                  name="text"
                  value={formData.text || ""}
                  onChange={handleChange}
                  placeholder="შეიყვანეთ ტექსტი"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="quantity_of_students">
                  სტუდენტების რაოდენობა * (მაგალითად: 6 -12)
                </Label>
                <Input
                  id="quantity_of_students"
                  name="quantity_of_students"
                  value={formData.quantity_of_students || ""}
                  onChange={handleChange}
                  placeholder="სტუდენტების რაოდენობა"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="old_price">ძველი ფასი</Label>
                <Input
                  id="old_price"
                  name="old_price"
                  type="number"
                  value={formData.old_price || ""}
                  onChange={handleNumericChange}
                  placeholder="ძველი ფასი"
                  className="border-amber-200"
                />
                <p className="text-xs text-muted-foreground">
                  ძველი (ჩვეულებრივი) ფასი ფასდაკლებამდე
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">მიმდინარე ფასი</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price || ""}
                  onChange={handleNumericChange}
                  placeholder="მიმდინარე ფასი"
                  className="border-green-200"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ახალი (დაკლებული) ფასი - ამჟამად მოქმედი
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_percentage">
                  ფასდაკლება (%)
                  {formData.discount_percentage && (
                    <span className="ml-2 text-green-600 font-bold">
                      {formData.discount_percentage}%
                    </span>
                  )}
                </Label>
                <Input
                  id="discount_percentage"
                  name="discount_percentage"
                  value={formData.discount_percentage || ""}
                  placeholder="ავტომატურად გამოითვლება"
                  readOnly
                  className="bg-gray-50"
                  style={{ display: "none" }}
                />
                <p className="text-xs text-muted-foreground">
                  ფასდაკლება ავტომატურად გამოითვლება ძველი და ახალი ფასის
                  საფუძველზე
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_of_lessons">
                  გაკვეთილების რაოდენობა
                </Label>
                <Input
                  id="quantity_of_lessons"
                  name="quantity_of_lessons"
                  value={formData.quantity_of_lessons || ""}
                  onChange={handleChange}
                  placeholder="მაგალითად: 10"
                  className="border-blue-200"
                />
                <p className="text-xs text-muted-foreground">
                  მიუთითეთ გაკვეთილების რაოდენობა, ხანგრძლივობა ან საათების
                  რაოდენობა
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson_time">გაკვეთილის ხანგრძლივობა</Label>
                <Input
                  id="lesson_time"
                  name="lesson_time"
                  value={formData.lesson_time || ""}
                  onChange={handleChange}
                  placeholder="მაგალითად: 2"
                  className="border-blue-200"
                />
                <p className="text-xs text-muted-foreground">
                  მიუთითეთ კურსის გაკვეთილების დრო
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_course">კურსის დაწყების თარიღი</Label>
                <Input
                  id="start_course"
                  name="start_course"
                  value={formData.start_course || ""}
                  onChange={handleChange}
                  placeholder="მაგალითად: იანვარი"
                  className="border-blue-200"
                />
                <p className="text-xs text-muted-foreground">
                  მიუთითეთ კურსის დაწყების თარიღი
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Image Uploads */}
              <div>
                <Label>კურსის სურათი</Label>
                <div className="mt-2 border-2 border-dashed rounded-md p-4 text-center">
                  {formData.image ? (
                    <div className="relative">
                      <img
                        src={formData.image}
                        alt="Course Image"
                        className="mx-auto max-h-64 rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, image: "" }))
                        }
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => triggerFileInput("image")}
                      className="cursor-pointer py-8 flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
                    >
                      {isUploading ? (
                        <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mb-2" />
                          <p>დააჭირეთ სურათის ასატვირთად</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileInputChange(e, "image")}
                  />
                </div>
              </div>

              <div>
                <Label>კურსის აიქონი</Label>
                <div className="mt-2 border-2 border-dashed rounded-md p-4 text-center">
                  {formData.courseIcon ? (
                    <div className="relative">
                      <img
                        src={formData.courseIcon}
                        alt="Course Icon"
                        className="mx-auto max-h-32 rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, courseIcon: "" }))
                        }
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => triggerFileInput("icon")}
                      className="cursor-pointer py-4 flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
                    >
                      {isIconUploading ? (
                        <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${iconUploadProgress}%` }}
                          ></div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mb-2" />
                          <p>დააჭირეთ აიქონის ასატვირთად</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={iconInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileInputChange(e, "icon")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>სხვა შეთავაზებისთვის პატარა ფოტო</Label>
                <div className="flex gap-4 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => triggerFileInput("section")}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} /> Upload
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={sectionInputRef}
                    onChange={(e) => handleFileInputChange(e, "section")}
                    style={{ display: "none" }}
                  />
                  {isSectionUploading && (
                    <div className="w-full max-w-xs">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${sectionUploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploading: {sectionUploadProgress}%
                      </p>
                    </div>
                  )}
                </div>

                {formData.section_image ? (
                  <div className="w-full max-w-md h-40 rounded-md overflow-hidden bg-muted relative mt-2">
                    <img
                      src={formData.section_image}
                      alt="Section preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/400x300?text=Invalid+Image";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-md h-40 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-dashed border-muted-foreground/50 mt-2">
                    <div className="text-muted-foreground flex flex-col items-center p-4">
                      <FileIcon size={40} strokeWidth={1} />
                      <span className="text-sm mt-2">ფოტო არ არის არჩეული</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Details */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label>კურსის დეტალები</Label>
            {formData.course_details.map((detail, index) => (
              <div key={`detail-${index}`} className="flex gap-2">
                <Input
                  value={detail}
                  onChange={(e) =>
                    handleArrayChange("course_details", index, e.target.value)
                  }
                  placeholder="კურსის დეტალი"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem("course_details", index)}
                  disabled={formData.course_details.length === 1}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => addArrayItem("course_details")}
            >
              <Plus size={16} /> დეტალის დამატება
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lecturers */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label>ლექტორები</Label>
            {formData.lecturers.map((lecturer, index) => (
              <div key={`lecturer-${index}`} className="flex gap-2">
                <Input
                  value={lecturer}
                  onChange={(e) =>
                    handleArrayChange("lecturers", index, e.target.value)
                  }
                  placeholder="ლექტორის სახელი"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem("lecturers", index)}
                  disabled={formData.lecturers.length === 1}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => addArrayItem("lecturers")}
            >
              <Plus size={16} /> ლექტორის დამატება
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lecturer Details */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label>ლექტორების დეტალები</Label>
            {formData.lecturers_details.map((detail, index) => (
              <div key={`lecturer-detail-${index}`} className="flex gap-2">
                <Input
                  value={detail}
                  onChange={(e) =>
                    handleArrayChange(
                      "lecturers_details",
                      index,
                      e.target.value
                    )
                  }
                  placeholder="ლექტორის დეტალი"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem("lecturers_details", index)}
                  disabled={formData.lecturers_details.length === 1}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => addArrayItem("lecturers_details")}
            >
              <Plus size={16} /> დეტალის დამატება
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Syllabus */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <Label className="text-lg font-medium">სილაბუსი</Label>

            {formData.syllabus_title.map((title, titleIndex) => (
              <div
                key={`syllabus-${titleIndex}`}
                className="border rounded-md p-4 space-y-4"
              >
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label>სილაბუსის სათაური</Label>
                    <Input
                      value={title}
                      onChange={(e) =>
                        handleArrayChange(
                          "syllabus_title",
                          titleIndex,
                          e.target.value
                        )
                      }
                      placeholder="სათაური"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() =>
                      removeArrayItem("syllabus_title", titleIndex)
                    }
                    disabled={formData.syllabus_title.length === 1}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="pl-4 border-l-2 border-muted space-y-3">
                  <Label>სილაბუსის შინაარსი</Label>

                  {formData.syllabus_content[titleIndex]?.map(
                    (content, contentIndex) => (
                      <div
                        key={`content-${titleIndex}-${contentIndex}`}
                        className="flex gap-2"
                      >
                        <Textarea
                          value={content}
                          onChange={(e) =>
                            handleSyllabusContentChange(
                              titleIndex,
                              contentIndex,
                              e.target.value
                            )
                          }
                          placeholder="შინაარსი"
                          rows={2}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeSyllabusContentItem(titleIndex, contentIndex)
                          }
                          disabled={
                            formData.syllabus_content[titleIndex]?.length === 1
                          }
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    )
                  )}

                  {
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => addSyllabusContentItem(titleIndex)}
                    >
                      <Plus size={16} /> შინაარსის დამატება
                    </Button>
                  }
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => addArrayItem("syllabus_title")}
            >
              <Plus size={16} /> სილაბუსის სექციის დამატება
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/offers")}
        >
          უკან დაბრუნება
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "მიმდინარეობს შენახვა..."
            : course?.id
              ? "განახლება"
              : "შექმნა"}
        </Button>
      </div>
    </form>
  );
}

export const revalidate = 60; // 1 წუთში განახლდება
