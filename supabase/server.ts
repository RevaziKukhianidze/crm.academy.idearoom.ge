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
