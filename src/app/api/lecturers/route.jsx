// src/app/api/lecturers/route.js
import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const supabase = createClient();

    if (id) {
      // Fetch a single lecturer
      const { data, error } = await supabase
        .from("lecturers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Fetch all lecturers
      const { data, error } = await supabase
        .from("lecturers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("lecturers")
      .insert([
        {
          fullName: body.fullName,
          field: body.field,
          lecturer_text: body.lecturer_text,
          lecturer_image: body.lecturer_image,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const supabase = createClient();

    if (!body.id) {
      return NextResponse.json(
        { error: "Lecturer ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("lecturers")
      .update({
        fullName: body.fullName,
        field: body.field,
        lecturer_text: body.lecturer_text,
        lecturer_image: body.lecturer_image,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Lecturer ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { error } = await supabase.from("lecturers").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
