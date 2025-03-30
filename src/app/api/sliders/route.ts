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
    const { title, text, image, button_link } = body;

    // Log data for debugging
    console.log("API Route: Processing slider creation");
    console.log("Title:", title);
    console.log("Text:", text);
    console.log("Button link:", button_link);
    console.log("Image exists:", !!image);

    // Create a properly typed structure for inserting
    const sliderData = {
      title: title || null,
      text: text || null,
      image: image || null,
      button_link: button_link || null,
    };

    // Make sure at least one field is filled
    if (!title && !text && !image && !button_link) {
      return NextResponse.json(
        { error: "At least one field must be filled" },
        { status: 400 }
      );
    }

    // Try to insert with image first if it exists
    if (image) {
      try {
        console.log("API Route: Attempting full insert with image");
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
