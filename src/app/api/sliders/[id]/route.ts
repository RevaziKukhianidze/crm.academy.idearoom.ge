import { createClient } from "../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;

  try {
    const { data, error } = await supabase
      .from("slider")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Slider not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabase = await createClient();

  try {
    // Parse the request body
    const body = await request.json();
    const { title, text, image, course_id, custom_url } = body;

    // Log data for debugging
    console.log("🔷 API Route: მიმდინარეობს სლაიდერის განახლება");
    console.log("🆔 სლაიდერის ID:", id);
    console.log("📝 სათაური:", title);
    console.log(
      "📝 ტექსტი:",
      text?.substring(0, 30) + (text?.length > 30 ? "..." : "")
    );
    console.log("🔢 კურსის ID:", course_id);
    console.log("🔗 ხელით შეყვანილი კურსის ID:", custom_url);
    console.log("🖼️ სურათი არსებობს:", !!image);
    console.log("🔢 კურსის ID ტიპი:", typeof course_id);
    console.log("📊 მთლიანი მოთხოვნის ობიექტი:", Object.keys(body).join(", "));

    // Create a properly typed structure for updating
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

    // Set button_link: ორივე ველიდან შეიძლება კურსის ID მივიღოთ
    if (custom_url && custom_url.trim()) {
      // ხელით შეყვანილი კურსის ID (/courses/ + ID)
      const courseIdFromCustom = custom_url.trim();
      const buttonLink = `/courses/${courseIdFromCustom}`;
      sliderData.button_link = buttonLink;
      console.log(
        "✅ button_link დაყენებულია ხელით შეყვანილი კურსის ID-ით:",
        buttonLink
      );
    } else if (course_id !== undefined && course_id !== null) {
      // თუ custom URL არ არის, ვიყენებთ ავტომატურ კურსის კავშირს
      const courseIdNum = Number(course_id);

      if (!isNaN(courseIdNum) && courseIdNum > 0) {
        const buttonLink = `/courses/${courseIdNum}`;
        console.log(
          "✅ button_link დაყენებულია კურსის ID-ზე დაყრდნობით:",
          buttonLink
        );
        sliderData.button_link = buttonLink;

        // Verify course existence
        try {
          const { data: courseExists } = await supabase
            .from("course")
            .select("id, title")
            .eq("id", courseIdNum)
            .single();

          if (courseExists) {
            console.log(
              `✅ კურსი ნაპოვნია: "${courseExists.title}" (ID: ${courseExists.id})`
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
      console.log(
        "ℹ️ არც custom_url არ არის არც course_id, button_link იქნება null"
      );
    }

    console.log("🔹 განახლებული მონაცემები:", {
      title: sliderData.title,
      text:
        sliderData.text?.substring(0, 20) +
        (sliderData.text && sliderData.text.length > 20 ? "..." : ""),
      button_link: sliderData.button_link,
      hasImage: !!sliderData.image,
    });

    // Output all keys and values for thorough debug
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

    // Check if slider exists
    const { data: existingSlider, error: checkError } = await supabase
      .from("slider")
      .select("*")
      .eq("id", id)
      .single();

    if (checkError) {
      console.error("Error checking if slider exists:", checkError);
      return NextResponse.json({ error: "Slider not found" }, { status: 404 });
    }

    // Update the slider
    const { data, error } = await supabase
      .from("slider")
      .update(sliderData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ შეცდომა სლაიდერის განახლებისას:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("✅ სლაიდერი წარმატებით განახლდა:", {
      id: data.id,
      title: data.title,
      button_link: data.button_link,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error updating slider:", error);
    return NextResponse.json(
      { error: "Server error processing request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;

  try {
    // Check if slider exists
    const { data: existingSlider, error: checkError } = await supabase
      .from("slider")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingSlider) {
      return NextResponse.json({ error: "Slider not found" }, { status: 404 });
    }

    // Delete the slider
    const { error } = await supabase.from("slider").delete().eq("id", id);

    if (error) {
      console.error("Error deleting slider:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
