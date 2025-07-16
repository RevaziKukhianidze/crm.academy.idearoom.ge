"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "../../../../supabase/client";

export default function TestDelete() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("Testing connection...");

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from("users_form")
        .select("count")
        .limit(1);

      if (error) {
        setResult(
          `Connection Error: ${error.message}\nDetails: ${error.details || "N/A"}\nHint: ${error.hint || "N/A"}`
        );
      } else {
        setResult(
          `Connection successful! Found table with ${JSON.stringify(data)} entries`
        );
      }
    } catch (err) {
      setResult(
        `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    setLoading(true);
    setResult("Testing insert...");

    try {
      const { data, error } = await supabase
        .from("users_form")
        .insert({
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          socialId: "12345678901",
        })
        .select();

      if (error) {
        setResult(
          `Insert Error: ${error.message}\nDetails: ${error.details || "N/A"}`
        );
      } else {
        setResult(`Insert successful! Created: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      setResult(
        `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testDelete = async () => {
    setLoading(true);
    setResult("Testing delete...");

    try {
      // First get a test user
      const { data: users, error: fetchError } = await supabase
        .from("users_form")
        .select("*")
        .limit(1);

      if (fetchError) {
        setResult(`Fetch Error: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (!users || users.length === 0) {
        setResult("No users found to delete. Try inserting a test user first.");
        setLoading(false);
        return;
      }

      const testUser = users[0];
      const { data, error } = await supabase
        .from("users_form")
        .delete()
        .eq("id", testUser.id)
        .select();

      if (error) {
        setResult(
          `Delete Error: ${error.message}\nDetails: ${error.details || "N/A"}\nCode: ${error.code || "N/A"}`
        );
      } else {
        setResult(`Delete successful! Deleted: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      setResult(
        `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    setLoading(true);
    setResult("Creating table...");

    try {
      // Try to create table using SQL
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS users_form (
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
        `,
      });

      if (error) {
        setResult(`Create Table Error: ${error.message}`);
      } else {
        setResult(`Table creation attempted: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      setResult(
        `JavaScript Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Debug Users Table</h2>

      <div className="space-x-2">
        <Button onClick={testConnection} disabled={loading}>
          Test Connection
        </Button>
        <Button onClick={createTable} disabled={loading}>
          Create Table
        </Button>
        <Button onClick={testInsert} disabled={loading}>
          Test Insert
        </Button>
        <Button onClick={testDelete} disabled={loading}>
          Test Delete
        </Button>
      </div>

      <div className="bg-gray-100 p-4 rounded min-h-[200px]">
        <h3 className="font-bold mb-2">Result:</h3>
        <pre className="whitespace-pre-wrap text-sm">
          {result || "Click a button to test..."}
        </pre>
      </div>
    </div>
  );
}
