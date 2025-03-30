import { createClient } from "../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const id = params.id;

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
    } = body;

    if (
      !title &&
      !course_details &&
      !image &&
      !start_course &&
      !quantity_lessons &&
      !quantity_of_students &&
      !lesson_time
    ) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
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

    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const id = params.id;

  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
