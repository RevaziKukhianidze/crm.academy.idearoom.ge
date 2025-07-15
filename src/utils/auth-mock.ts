import { supabase } from "../../supabase/client";

export const mockAuth = async () => {
  try {
    // Create a mock session for Supabase
    const mockUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "admin@idearoom.ge",
      user_metadata: {
        name: "Admin User",
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    // Set fake session in supabase (simplified)
    await supabase.auth.setSession({
      access_token: "fake-access-token-for-local-development",
      refresh_token: "fake-refresh-token",
    });

    console.log("Mock authentication set successfully");
    return true;
  } catch (error) {
    console.error("Error setting mock auth:", error);
    return false;
  }
};

export const checkAuthAndMock = async () => {
  const isLocalAuth = localStorage.getItem("isAuthenticated") === "true";

  if (isLocalAuth) {
    // Check if supabase also has session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log(
        "Local auth found but no Supabase session. Setting mock session..."
      );
      await mockAuth();
    }
  }

  return isLocalAuth;
};
