import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get query parameters
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    // Get a specific slider
    const { data, error } = await supabase
      .from("slider")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } else {
    // Get all sliders
    const { data, error } = await supabase
      .from("slider")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Parse the request body
    const body = await request.json();
    const { title, text, image, course_id } = body;

    // Log data for debugging
    console.log("🔹 API Route: დაიწყო სლაიდერის შექმნა");
    console.log("📝 სათაური:", title);
    console.log(
      "📝 ტექსტი:",
      text?.substring(0, 30) + (text?.length > 30 ? "..." : "")
    );
    console.log("🔢 კურსის ID:", course_id);
    console.log("🖼️ სურათი არსებობს:", !!image);
    console.log("🔢 კურსის ID ტიპი:", typeof course_id);
    console.log("🔢 კურსის ID მნიშვნელობა:", course_id);

    // Create a properly typed structure for inserting
    const sliderData: {
      title: string | null;
      text: string | null;
      image: string | null;
      button_link: string | null;
    } = {
      title: title || null,
      text: text || null,
      image: image || null,
      button_link: null, // Will be set based on course_id
    };

    // Set button_link based on course_id - ამ ეტაპზე ყურადღებით შეამოწმეთ
    if (course_id !== undefined && course_id !== null) {
      // გავრცელებული შემოწმება course_id-ის ვალიდურობისთვის
      const courseIdNum = Number(course_id);

      if (!isNaN(courseIdNum) && courseIdNum > 0) {
        const buttonLink = `/courses/${courseIdNum}`;
        console.log(
          "✅ button_link დაყენებულია კურსის ID-ზე დაყრდნობით:",
          buttonLink
        );
        sliderData.button_link = buttonLink;

        // დამატებითი შემოწმება course ცხრილში
        try {
          const { data: courseExists } = await supabase
            .from("course")
            .select("id, title")
            .eq("id", courseIdNum)
            .single();

          if (courseExists) {
            console.log(
              "✅ course_id ვალიდურია, კურსი ნაპოვნია:",
              courseExists.title
            );
          } else {
            console.log(
              "⚠️ course_id ვერ მოიძებნა ბაზაში, მაგრამ button_link მაინც დაყენდა"
            );
          }
        } catch (err) {
          console.log("⚠️ შეცდომა კურსის არსებობის შემოწმებისას:", err);
        }
      } else {
        console.log("⚠️ არავალიდური course_id ფორმატი:", course_id);
      }
    } else {
      console.log("ℹ️ course_id არ არსებობს, button_link იქნება null");
    }

    console.log("🔹 საბოლოო მონაცემები ბაზაში შესანახად:", {
      title: sliderData.title,
      text: sliderData.text?.substring(0, 20) + "...",
      button_link: sliderData.button_link,
    });

    // Output all keys and values for proper debug
    Object.entries(sliderData).forEach(([key, value]) => {
      console.log(
        `${key}: ${value === null ? "null" : typeof value === "string" && value.length > 100 ? value.substring(0, 100) + "..." : value}`
      );
    });

    // Make sure at least one field is filled
    if (!title && !text && !image) {
      return NextResponse.json(
        { error: "At least one field must be filled" },
        { status: 400 }
      );
    }

    // Try to insert with image first if it exists
    if (image) {
      try {
        console.log("API Route: Attempting full insert with image");
        console.log(
          "Final data going into database:",
          JSON.stringify(sliderData, null, 2)
        );

        const { data, error } = await supabase
          .from("slider")
          .insert([sliderData])
          .select()
          .single();

        if (error) {
          console.error("API Route: Error with full insert:", error);
          throw error;
        }

        console.log("API Route: Successfully created slider with image");
        console.log("Saved data from database:", JSON.stringify(data, null, 2));
        return NextResponse.json(data, { status: 201 });
      } catch (fullInsertError) {
        console.error(
          "API Route: Full insert failed, trying two-step approach"
        );

        // If that fails, try without image
        const { image, ...dataWithoutImage } = sliderData;

        // First insert without the image
        const { data: initialData, error: initialError } = await supabase
          .from("slider")
          .insert([dataWithoutImage])
          .select()
          .single();

        if (initialError) {
          console.error("API Route: Error with initial insert:", initialError);
          return NextResponse.json(
            { error: initialError.message },
            { status: 400 }
          );
        }

        // Then update with the image
        const newSliderId = initialData.id;

        // Recheck button_link is included in initialData
        console.log(
          "Initial data saved to DB:",
          JSON.stringify(initialData, null, 2)
        );

        const { error: updateError } = await supabase
          .from("slider")
          .update({ image })
          .eq("id", newSliderId);

        if (updateError) {
          console.error("API Route: Error updating with image:", updateError);
          return NextResponse.json(
            {
              partialSuccess: true,
              error: "Slider created but image couldn't be added",
              data: initialData,
            },
            { status: 207 }
          );
        }

        // Get the updated record
        const { data: updatedData } = await supabase
          .from("slider")
          .select("*")
          .eq("id", newSliderId)
          .single();

        console.log(
          "API Route: Successfully created slider with two-step approach"
        );
        return NextResponse.json(updatedData, { status: 201 });
      }
    } else {
      // Simple insert without image
      console.log("API Route: Simple insert without image");
      console.log(
        "Final data going into database:",
        JSON.stringify(sliderData, null, 2)
      );

      const { data, error } = await supabase
        .from("slider")
        .insert([sliderData])
        .select()
        .single();

      if (error) {
        console.error("API Route: Error with simple insert:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      console.log("API Route: Successfully created slider");
      console.log("Saved data from database:", JSON.stringify(data, null, 2));
      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error("API Route: Unexpected error:", error);
    return NextResponse.json(
      { error: "Server error processing request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  // Get ID from URL
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Slider ID is required" },
      { status: 400 }
    );
  }

  // Delete the slider
  const { error } = await supabase.from("slider").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
