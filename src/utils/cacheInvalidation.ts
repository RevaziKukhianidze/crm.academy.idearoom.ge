// Cache invalidation utility for main academy website
export async function invalidateMainSiteCache(
  type: "courses" | "blogs",
  key?: string
) {
  try {
    // URL of the main academy website cache clear endpoint
    const mainSiteUrl =
      process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://academy.idearoom.ge";
    const cacheEndpoint = `${mainSiteUrl}/api/cache/clear`;

    console.log(`Attempting to clear cache for ${type} on main site...`);

    const response = await fetch(cacheEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        key,
      }),
    });

    if (!response.ok) {
      console.warn(
        `Failed to clear main site cache: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const result = await response.json();
    console.log("Main site cache cleared successfully:", result);
    return true;
  } catch (error) {
    console.error("Error clearing main site cache:", error);
    // Don't throw error - cache clearing should not break the main operation
    return false;
  }
}

// Convenience functions
export const clearCoursesCache = (courseId?: string) =>
  invalidateMainSiteCache("courses", courseId);

export const clearBlogsCache = (blogId?: string) =>
  invalidateMainSiteCache("blogs", blogId);
