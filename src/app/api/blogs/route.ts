import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { clearBlogsCache } from "../../../utils/cacheInvalidation";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get query parameters
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    // Get a specific blog post
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } else {
    // Get all blog posts
    const { data, error } = await supabase
      .from("blogs")
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
    const { title, text, image, tags, image_file_path, image_file_name } = body;

    if (!title || !text) {
      return NextResponse.json(
        { error: "Title and text are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("blogs")
      .insert([
        {
          title,
          text,
          image,
          tags,
          image_file_path,
          image_file_name,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Failed to create blog" },
        { status: 500 }
      );
    }

    // Invalidate all related paths in admin
    revalidatePath("/");
    revalidatePath("/dashboard/blogs");

    // Clear main site cache for all blog-related pages
    await clearBlogsCache(data.id?.toString());

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
