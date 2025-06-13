import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const supabase = await createClient();

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");

  try {
    // Get all offered courses, ordered by creation date (newest first)
    let query = supabase
      .from("offered_course")
      .select("*")
      .order("created_at", { ascending: false });

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        query = query.limit(limit);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching offered courses:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // Parse request body
    const offeredCourse = await request.json();
    console.log(
      "Attempting to create offered course:",
      JSON.stringify(
        {
          title: offeredCourse.title,
          hasImage: !!offeredCourse.image,
          hasIcon: !!offeredCourse.courseIcon,
          imageLength: offeredCourse.image ? offeredCourse.image.length : 0,
          iconLength: offeredCourse.courseIcon
            ? offeredCourse.courseIcon.length
            : 0,
          quantity_of_lessons: offeredCourse.quantity_of_lessons,
          lesson_time: offeredCourse.lesson_time,
          start_course: offeredCourse.start_course,
          arrayFields: {
            lecturers: Array.isArray(offeredCourse.lecturers),
            lecturers_details: Array.isArray(offeredCourse.lecturers_details),
            course_details: Array.isArray(offeredCourse.course_details),
            course_category: Array.isArray(offeredCourse.course_category),
            syllabus_title: Array.isArray(offeredCourse.syllabus_title),
            syllabus_content: Array.isArray(offeredCourse.syllabus_content),
          },
          syllabus_content_type: typeof offeredCourse.syllabus_content,
        },
        null,
        2
      )
    );

    // Ensure syllabus_content is valid JSON/JSONB for PostgreSQL
    let processedData = { ...offeredCourse };

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
      if (!Array.isArray(processedData[field])) {
        processedData[field] = processedData[field]
          ? [processedData[field]]
          : [""];
      }
    });

    // Insert the new offered course
    const { data, error } = await supabase
      .from("offered_course")
      .insert(processedData)
      .select();

    if (error) {
      console.error("Error creating offered course:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error("No data returned after insertion");
      return NextResponse.json(
        { error: "Failed to create offered course" },
        { status: 500 }
      );
    }

    console.log("Successfully created offered course:", data[0].id);

    // Invalidate cache after creation
    revalidatePath("/offers");
    revalidatePath("/");

    // Return the first item from the array (should be the only one)
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Server error during offered course creation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
