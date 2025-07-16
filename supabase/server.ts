import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const createClient = async () => {
  console.log(
    "Creating Supabase client with URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL ? "Defined" : "Undefined"
  );
  console.log(
    "Creating Supabase client with ANON KEY:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Defined" : "Undefined"
  );

  // Ensure environment variables are defined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("Missing required Supabase environment variables");
  }

  try {
    return createSupabaseClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    throw error;
  }
};

// Admin client with service role for bypassing RLS in admin operations
export const createAdminClient = async () => {
  console.log(
    "Creating Supabase ADMIN client with URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL ? "Defined" : "Undefined"
  );
  console.log(
    "Creating Supabase ADMIN client with SERVICE KEY:",
    process.env.SUPABASE_SERVICE_ROLE_KEY ? "Defined" : "Undefined"
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase admin environment variables");
    // Fallback to regular client if service role is not available
    console.log("Falling back to regular client with anon key");
    return createClient();
  }

  try {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("Error creating Supabase admin client:", error);
    throw error;
  }
};
