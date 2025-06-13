import { createClient } from "../../supabase/server";
import Link from "next/link";
import Image from "next/image";

interface Course {
  id: number;
  title: string;
  image?: string;
  section_image?: string;
  price?: number;
  created_at: string;
}

interface OtherCoursesProps {
  currentCourseId?: number;
  className?: string;
}

export default async function OtherCourses({
  currentCourseId,
  className = "",
}: OtherCoursesProps) {
  const supabase = await createClient();

  // Fetch latest 5 courses, excluding current one
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, image, section_image, price, created_at")
    .order("created_at", { ascending: false })
    .limit(6); // Get 6 to ensure we have 5 after filtering current

  if (error) {
    console.error("Error fetching other courses:", error);
    return null;
  }

  // Filter out current course and limit to 5
  const filteredCourses =
    courses?.filter((course) => course.id !== currentCourseId).slice(0, 5) ||
    [];

  if (filteredCourses.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        სხვა კურსები
      </h3>
      <div className="grid gap-3">
        {filteredCourses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={
                  course.section_image ||
                  course.image ||
                  "/placeholder-course.jpg"
                }
                alt={course.title}
                fill
                className="object-cover rounded-md"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {course.title}
              </h4>
              {course.price && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ₾{course.price}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic";
