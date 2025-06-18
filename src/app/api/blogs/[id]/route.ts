import { createClient } from "../../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { clearBlogsCache } from "../../../../utils/cacheInvalidation";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;

  try {
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

    // Return blog data with linkTag
    const blogData = {
      ...data,
      linkTag: data.linkTag || [],
    };

    return NextResponse.json(blogData);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;

  try {
    const { title, text, image, linkTag, image_file_path, image_file_name } =
      await request.json();

    if (
      !title &&
      !text &&
      !image &&
      !linkTag &&
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

    // Normalise linkTag: treat empty arrays as null so the previous value is
    // actually removed from the database. Also keep the legacy `tags` column
    // in sync for the public site until it migrates to the new field.
    if (linkTag !== undefined) {
      // For JSON column, use empty array instead of null
      const normalisedLinkTag = Array.isArray(linkTag) ? linkTag : [];

      updates.linkTag = normalisedLinkTag;
      // For legacy tags column, use null if empty array
      updates.tags =
        normalisedLinkTag.length > 0
          ? normalisedLinkTag.map((tag) => tag.name || tag)
          : null;
    }

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

    // Return blog data with linkTag
    const blogData = {
      ...data,
      linkTag: data.linkTag || [],
    };

    // Invalidate all related paths in admin
    revalidatePath("/");
    revalidatePath("/dashboard/blogs");

    // Clear main site cache for all blog-related pages
    await clearBlogsCache(id);

    return NextResponse.json(blogData);
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
