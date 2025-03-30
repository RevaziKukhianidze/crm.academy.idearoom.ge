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
  const supabase = await createClient();
  const id = params.id;

  try {
    const body = await request.json();
    const { title, text, image, button_link } = body;

    // Create a properly typed structure for updating
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

    // Check if slider exists
    const { data: existingSlider, error: checkError } = await supabase
      .from("slider")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingSlider) {
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
      console.error("Error updating slider:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
