const { createClient } = require("@supabase/supabase-js");

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This should be service role key with admin access

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSectionImageColumn() {
  try {
    console.log("Adding section_image column to courses table...");

    // Execute SQL to add the column
    const { data, error } = await supabase.rpc("exec_sql", {
      query: `
          ALTER TABLE courses ADD COLUMN IF NOT EXISTS section_image TEXT;
          COMMENT ON COLUMN courses.section_image IS 'Image URL for displaying course in sections/listings on the website';
        `,
    });

    if (error) {
      return;
    }

    console.log("✅ Successfully added section_image column to courses table");

    // Verify the column was added
    const { data: columns, error: verifyError } = await supabase.rpc(
      "exec_sql",
      {
        query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'courses' AND column_name = 'section_image';
        `,
      }
    );

    if (verifyError) {
      console.error("Error verifying column:", verifyError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log("✅ Column verification successful:", columns);
    } else {
      console.log("⚠️  Column verification returned no results");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// Alternative approach using direct SQL query if rpc doesn't work
async function addColumnDirectSQL() {
  try {
    console.log("Attempting direct SQL approach...");

    const { data, error } = await supabase.from("courses").select("*").limit(1);

    if (error) {
      console.error("Database connection error:", error);
      return;
    }

    console.log("✅ Database connection successful");
    console.log(
      "ℹ️  Please run the following SQL manually in Supabase SQL Editor:"
    );
    console.log("");
    console.log(
      `ALTER TABLE courses ADD COLUMN IF NOT EXISTS section_image TEXT;`
    );
    console.log(
      `COMMENT ON COLUMN courses.section_image IS 'Image URL for displaying course in sections/listings on the website';`
    );
    console.log("");
  } catch (err) {
    console.error("Error:", err);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting section_image column addition...");
  await addSectionImageColumn();

  // If that doesn't work, try the alternative approach
  console.log("\n📋 Alternative manual approach:");
  await addColumnDirectSQL();
}

main();
