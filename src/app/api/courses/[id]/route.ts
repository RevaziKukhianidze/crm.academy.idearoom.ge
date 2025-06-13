import { log } from "console";
import { createClient } from "../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clearCoursesCache } from "../../../../utils/cacheInvalidation";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = parseInt(params.id, 10);

  // Check if id is valid
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  console.log(123);

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

    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

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
  const supabase = await createClient();
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
