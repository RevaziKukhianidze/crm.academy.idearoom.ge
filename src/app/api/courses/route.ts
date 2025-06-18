import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clearCoursesCache } from "../../../utils/cacheInvalidation";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get query parameters
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const limitParam = url.searchParams.get("limit");

  console.log(`API: GET request - id: ${id}, limit: ${limitParam}`);

  if (id) {
    // Get a specific course
    const courseId = parseInt(id, 10);
    console.log(`API: Requested course ID: ${id}, parsed as: ${courseId}`);

    // Check if id is valid
    if (isNaN(courseId)) {
      console.log(`API: Invalid course ID: ${id}`);
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

    console.log(`API: Supabase query result for ID ${courseId}:`, {
      data,
      error,
    });

    if (error) {
      console.error(`API: Supabase error for course ID ${courseId}:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      console.log(`API: Course not found for ID ${courseId}`);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    console.log(`API: Successfully found course for ID ${courseId}`);
    return NextResponse.json(data);
  } else {
    // Get all courses
    let query = supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        query = query.limit(limit);
      }
    }

    const { data, error } = await query;

    console.log(`API: Retrieved ${data?.length || 0} courses from database`);
    console.log(`API: Course IDs in database:`, data?.map((c) => c.id) || []);

    if (error) {
      console.error("API: Error fetching all courses:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      title,
      course_details,
      image,
      start_course,
      quantity_lessons,
      quantity_of_students,
      lesson_time,
      lecturer,
      lecturer_details,
      price,
      oldprice,
      syllabus_title,
      syllabus_content,
      courseIcon,
      section_image,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("courses")
      .insert([
        {
          title,
          course_details,
          image,
          start_course,
          quantity_lessons,
          quantity_of_students,
          lesson_time,
          lecturer,
          lecturer_details,
          price,
          oldprice,
          syllabus_title,
          syllabus_content,
          courseIcon,
          section_image,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    // Invalidate all related paths in admin
    revalidatePath("/courses");
    revalidatePath("/");
    revalidatePath("/dashboard/courses");

    // Clear main site cache for all course-related pages
    await clearCoursesCache(data.id?.toString());

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
