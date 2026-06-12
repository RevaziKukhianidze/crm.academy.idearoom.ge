import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
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
    const body = await request.json();

    // button_link is composed by the form and sent directly — no server-side assembly needed.
    const { title, text, image, button_link } = body;

    if (!title && !text && !image) {
      return NextResponse.json(
        { error: "At least one field must be filled" },
        { status: 400 }
      );
    }

    const sliderData = {
      title: title?.trim() || null,
      text: text?.trim() || null,
      image: image || null,
      button_link: button_link || null,
    };

    const { data, error } = await supabase
      .from("slider")
      .insert([sliderData])
      .select()
      .single();

    if (error) {
      console.error("Error creating slider:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Server error processing request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Slider ID is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("slider").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}