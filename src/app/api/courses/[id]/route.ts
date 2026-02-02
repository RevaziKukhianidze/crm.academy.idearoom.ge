import { log } from "console";
import {
  createClient,
  createAdminClient,
} from "../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clearCoursesCache } from "../../../../utils/cacheInvalidation";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create Supabase admin client to bypass RLS for admin operations
  const supabase = await createAdminClient();
  const id = parseInt(params.id, 10);

  // Check if admin client is actually using service role key
  const isUsingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(
    `🔧 PUT API: Updating course with ID: ${params.id}, parsed as: ${id}`
  );
  console.log(
    `🔑 PUT API: Admin client using service role key: ${isUsingServiceRole ? "YES ✅" : "NO ❌ (falling back to anon key - RLS may block updates)"}`
  );

  // Check if id is valid
  if (isNaN(id)) {
    console.log(`❌ PUT API: Invalid course ID: ${params.id}`);
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  // Debug: შევამოწმოთ თუ არსებობს კურსი PUT-ის წინ
  const { data: existingCourse, error: checkError } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();

  console.log(`🔍 PUT API: Checking if course exists:`, {
    existingCourse,
    checkError,
  });

  if (checkError) {
    console.error(`❌ PUT API: Error checking course existence:`, checkError);
  }

  if (!existingCourse) {
    console.log(`❌ PUT API: Course with ID ${id} does not exist in database`);
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  console.log(
    `✅ PUT API: Course exists: ${existingCourse.title} (ID: ${existingCourse.id})`
  );

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

    if (
      !title &&
      !course_details &&
      !image &&
      !start_course &&
      !quantity_lessons &&
      !quantity_of_students &&
      !lesson_time &&
      !lecturer &&
      !lecturer_details &&
      price === undefined &&
      oldprice === undefined &&
      !syllabus_title &&
      !syllabus_content &&
      !courseIcon &&
      !section_image
    ) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (course_details !== undefined) updates.course_details = course_details;
    if (image !== undefined) updates.image = image;
    if (start_course !== undefined) updates.start_course = start_course;
    if (quantity_lessons !== undefined)
      updates.quantity_lessons = quantity_lessons;
    if (quantity_of_students !== undefined)
      updates.quantity_of_students = quantity_of_students;
    if (lesson_time !== undefined) updates.lesson_time = lesson_time;
    if (lecturer !== undefined) updates.lecturer = lecturer;
    if (lecturer_details !== undefined)
      updates.lecturer_details = lecturer_details;
    if (price !== undefined) updates.price = price;
    if (oldprice !== undefined) updates.oldprice = oldprice;
    if (syllabus_title !== undefined) updates.syllabus_title = syllabus_title;
    if (syllabus_content !== undefined)
      updates.syllabus_content = syllabus_content;
    if (courseIcon !== undefined) updates.courseIcon = courseIcon;
    if (section_image !== undefined) updates.section_image = section_image;

    console.log(`🔧 PUT API: Updating course ${id} with data:`, updates);

    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select();

    console.log(`🔧 PUT API: Supabase update result:`, { data, error });

    if (error) {
      console.error(`❌ PUT API: Supabase error for course ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      console.log(
        `❌ PUT API: Update returned no data for ID ${id} - this means the course was not found during update`
      );
      const isUsingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!isUsingServiceRole) {
        console.error(
          `❌ PUT API: CRITICAL - SUPABASE_SERVICE_ROLE_KEY is not set! Admin client is using anon key, which is subject to RLS policies.`
        );
        console.error(
          `❌ PUT API: RLS policies are likely blocking the update operation. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.`
        );
        return NextResponse.json(
          { 
            error: "Course not found during update. This is likely due to missing SUPABASE_SERVICE_ROLE_KEY environment variable causing RLS policy restrictions.",
            details: "The admin client is falling back to anon key which cannot bypass Row Level Security policies."
          },
          { status: 500 }
        );
      }
      console.log(
        `❌ PUT API: This could be RLS policy issue or the course was deleted between checks`
      );
      return NextResponse.json(
        { error: "Course not found during update" },
        { status: 404 }
      );
    }

    console.log(`✅ PUT API: Successfully updated course ${id}`);
    console.log(`✅ PUT API: Updated course title: ${data[0]?.title}`);

    const updatedCourse = data[0];

    // Invalidate all related paths in admin
    revalidatePath("/courses");
    revalidatePath("/");
    revalidatePath("/dashboard/courses");

    // Clear main site cache
    await clearCoursesCache();
    await clearCoursesCache(id.toString());

    return NextResponse.json(updatedCourse);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createAdminClient();
  const id = parseInt(params.id, 10);

  // Check if id is valid
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Ensure ISR / tagged fetches are invalidated
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath("/dashboard/courses");

  // Clear main site cache
  await clearCoursesCache();
  await clearCoursesCache(id.toString());

  return NextResponse.json({ success: true });
}
