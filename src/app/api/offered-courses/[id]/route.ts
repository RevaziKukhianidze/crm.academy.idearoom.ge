import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

// GET an individual offered course by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = parseInt(params.id, 10);

  try {
    // Using maybeSingle() instead of single() to avoid error if not found
    const { data, error } = await supabase
      .from("offered_course")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching offered course:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Offered course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE an offered course by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = parseInt(params.id, 10);

  try {
    const updates = await request.json();
    console.log(`Attempting to update offered course ID ${id}`);

    // First, check if the course exists
    const { data: existingCourse, error: checkError } = await supabase
      .from("offered_course")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking if offered course exists:", checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!existingCourse) {
      console.log(`Offered course with ID ${id} not found`);
      return NextResponse.json(
        { error: "Offered course not found" },
        { status: 404 }
      );
    }

    console.log(
      "Attempting to update offered course:",
      JSON.stringify(
        {
          title: updates.title,
          hasImage: !!updates.image,
          hasIcon: !!updates.courseIcon,
          imageLength: updates.image ? updates.image.length : 0,
          iconLength: updates.courseIcon ? updates.courseIcon.length : 0,
          quantity_of_lessons: updates.quantity_of_lessons,
          lesson_time: updates.lesson_time,
          start_course: updates.start_course,
          arrayFields: {
            lecturers: Array.isArray(updates.lecturers),
            lecturers_details: Array.isArray(updates.lecturers_details),
            course_details: Array.isArray(updates.course_details),
            course_category: Array.isArray(updates.course_category),
            syllabus_title: Array.isArray(updates.syllabus_title),
            syllabus_content: Array.isArray(updates.syllabus_content),
          },
          syllabus_content_type: typeof updates.syllabus_content,
        },
        null,
        2
      )
    );

    // Ensure data is properly formatted for PostgreSQL
    let processedData = { ...updates };

    // If syllabus_content is empty or invalid, initialize it properly
    if (
      !processedData.syllabus_content ||
      typeof processedData.syllabus_content !== "object" ||
      !Array.isArray(processedData.syllabus_content)
    ) {
      processedData.syllabus_content = [[""]];
    } else {
      // Ensure all inner arrays exist
      processedData.syllabus_content = processedData.syllabus_content.map(
        (innerArray: any) => {
          if (!Array.isArray(innerArray)) {
            return [""];
          }
          return innerArray;
        }
      );
    }

    // Ensure all array fields are valid
    const arrayFields = [
      "lecturers",
      "lecturers_details",
      "course_details",
      "syllabus_title",
      "course_category",
    ];
    arrayFields.forEach((field) => {
      if (
        processedData[field] !== undefined &&
        !Array.isArray(processedData[field])
      ) {
        processedData[field] = processedData[field]
          ? [processedData[field]]
          : [""];
      }
    });

    // Then update it - remove single() to avoid JSON error
    const { data, error } = await supabase
      .from("offered_course")
      .update(processedData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating offered course:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error("No data returned after update");
      return NextResponse.json(
        { error: "Failed to update offered course" },
        { status: 500 }
      );
    }

    console.log(`Successfully updated offered course ID ${id}`);
    // Return the first item from the results (should be only one)
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Server error during offered course update:", error);
    // Return more specific error information if available
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE an offered course by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = parseInt(params.id, 10);

  try {
    // First, check if the course exists
    const { data: existingCourse } = await supabase
      .from("offered_course")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Offered course not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("offered_course")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting offered course:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Offered course deleted successfully",
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
