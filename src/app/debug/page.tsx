"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "../../../supabase/client";

export default function DebugPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const testConnection = async () => {
    setLoading(true);
    setResult("Testing Supabase connection...\n");

    try {
      // Test basic connection with auth check
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setResult((prev) => prev + `Auth Error: ${authError.message}\n`);
      } else {
        setResult(
          (prev) =>
            prev +
            `Auth Status: ${user ? "Authenticated" : "Not authenticated"}\n`
        );
      }

      // Test table access
      const { data, error } = await supabase
        .from("users_form")
        .select("count", { count: "exact" });

      if (error) {
        setResult(
          (prev) =>
            prev +
            `Table Error: ${error.message}\nDetails: ${error.details || "N/A"}\nCode: ${error.code || "N/A"}\n`
        );
      } else {
        setResult(
          (prev) =>
            prev + `Table Access: SUCCESS - Count: ${JSON.stringify(data)}\n`
        );
      }
    } catch (err) {
      setResult(
        (prev) =>
          prev +
          `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setResult("Fetching all users...\n");

    try {
      const { data, error } = await supabase
        .from("users_form")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setResult((prev) => prev + `Fetch Error: ${error.message}\n`);
      } else {
        setUsers(data || []);
        setResult(
          (prev) => prev + `Fetch Success: Found ${data?.length || 0} users\n`
        );
      }
    } catch (err) {
      setResult(
        (prev) =>
          prev +
          `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    setLoading(true);
    setResult("Testing insert...\n");

    try {
      const testUser = {
        email: `test${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
        socialId: `${Date.now()}`.slice(-11),
        phoneNumber: "555-0123",
        choosedCourse: "Test Course",
      };

      const { data, error } = await supabase
        .from("users_form")
        .insert(testUser)
        .select();

      if (error) {
        setResult(
          (prev) =>
            prev +
            `Insert Error: ${error.message}\nDetails: ${error.details || "N/A"}\n`
        );
      } else {
        setResult((prev) => prev + `Insert Success: ${JSON.stringify(data)}\n`);
        fetchUsers(); // Refresh list
      }
    } catch (err) {
      setResult(
        (prev) =>
          prev +
          `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  const testDelete = async (userId: number) => {
    setLoading(true);
    setResult(`Testing delete of user ID: ${userId}...\n`);

    try {
      console.log("Attempting to delete user ID:", userId);

      const { data, error } = await supabase
        .from("users_form")
        .delete()
        .eq("id", userId)
        .select();

      console.log("Delete result:", { data, error });

      if (error) {
        setResult(
          (prev) =>
            prev +
            `Delete Error: ${error.message}\nDetails: ${error.details || "N/A"}\nCode: ${error.code || "N/A"}\n`
        );
      } else {
        setResult((prev) => prev + `Delete Success: ${JSON.stringify(data)}\n`);
        fetchUsers(); // Refresh list
      }
    } catch (err) {
      setResult(
        (prev) =>
          prev +
          `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    setLoading(true);
    setResult("Creating users_form table...\n");

    try {
      // Try to create table using direct SQL
      const { data, error } = await supabase.rpc("sql", {
        query: `
          CREATE TABLE IF NOT EXISTS public.users_form (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            email TEXT,
            firstName TEXT,
            lastName TEXT,
            phoneNumber TEXT,
            socialId TEXT,
            birth_date DATE,
            choosedCourse TEXT,
            choosedMedia TEXT
          );

          ALTER TABLE public.users_form ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.users_form;
          CREATE POLICY "Allow authenticated users to read" ON public.users_form
            FOR SELECT TO authenticated USING (true);

          DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.users_form;
          CREATE POLICY "Allow authenticated users to insert" ON public.users_form
            FOR INSERT TO authenticated WITH CHECK (true);

          DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.users_form;
          CREATE POLICY "Allow authenticated users to delete" ON public.users_form
            FOR DELETE TO authenticated USING (true);

          DROP POLICY IF EXISTS "Allow anonymous to insert" ON public.users_form;
          CREATE POLICY "Allow anonymous to insert" ON public.users_form
            FOR INSERT TO anon WITH CHECK (true);
        `,
      });

      if (error) {
        setResult((prev) => prev + `Create Table Error: ${error.message}\n`);
      } else {
        setResult(
          (prev) =>
            prev + `Table Creation: ${JSON.stringify(data) || "SUCCESS"}\n`
        );
      }
    } catch (err) {
      setResult(
        (prev) =>
          prev +
          `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}\n`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Supabase & Users Table</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={testConnection}
              disabled={loading}
              className="w-full"
            >
              1. Test Connection & Auth
            </Button>
            <Button onClick={createTable} disabled={loading} className="w-full">
              2. Create Table & Policies
            </Button>
            <Button onClick={fetchUsers} disabled={loading} className="w-full">
              3. Fetch Users
            </Button>
            <Button onClick={testInsert} disabled={loading} className="w-full">
              4. Test Insert User
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users List ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <br />
                    <small className="text-gray-500">
                      ID: {user.id} | {user.email}
                    </small>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => testDelete(user.id)}
                    disabled={loading}
                  >
                    წაშლა
                  </Button>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-500">
                  No users found. Try fetching or inserting some.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded min-h-[300px] max-h-[500px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {result || "Click a test button to see results..."}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
