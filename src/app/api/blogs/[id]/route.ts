import { createClient } from "../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { clearBlogsCache } from "../../../../utils/cacheInvalidation";
import { revalidatePath } from "next/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;

  try {
    const body = await request.json();
    const { title, text, image, tags, image_file_path, image_file_name } = body;

    if (
      !title &&
      !text &&
      !image &&
      !tags &&
      !image_file_path &&
      !image_file_name
    ) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (text) updates.text = text;
    if (image !== undefined) updates.image = image;
    if (tags !== undefined) updates.tags = tags;
    if (image_file_path !== undefined)
      updates.image_file_path = image_file_path;
    if (image_file_name !== undefined)
      updates.image_file_name = image_file_name;

    const { data, error } = await supabase
      .from("blogs")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Invalidate all related paths in admin
    revalidatePath("/");
    revalidatePath("/dashboard/blogs");

    // Clear main site cache for all blog-related pages
    await clearBlogsCache(id);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;

  const { error } = await supabase.from("blogs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Invalidate all related paths in admin
  revalidatePath("/");
  revalidatePath("/dashboard/blogs");

  // Clear main site cache for all blog-related pages
  await clearBlogsCache(id);

  return NextResponse.json({ success: true });
}
