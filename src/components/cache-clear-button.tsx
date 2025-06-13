"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";
import { clearCoursesCache, clearBlogsCache } from "../utils/cacheInvalidation";

interface CacheClearButtonProps {
  type: "courses" | "blogs";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function CacheClearButton({
  type,
  variant = "outline",
  size = "sm",
  className = "",
}: CacheClearButtonProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [lastClearTime, setLastClearTime] = useState<Date | null>(null);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      let success;
      if (type === "courses") {
        success = await clearCoursesCache();
      } else {
        success = await clearBlogsCache();
      }

      if (success) {
        setLastClearTime(new Date());
        console.log(`${type} cache cleared successfully`);
      } else {
        console.warn(`Failed to clear ${type} cache`);
      }
    } catch (error) {
      console.error(`Error clearing ${type} cache:`, error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleClearCache}
        disabled={isClearing}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        title={`მთავარი საიტის ${type === "courses" ? "კურსების" : "ბლოგების"} cache-ის გასუფთავება`}
      >
        {isClearing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Cache გასუფთავება</span>
      </Button>

      {lastClearTime && (
        <span className="text-xs text-muted-foreground">
          ბოლო: {lastClearTime.toLocaleTimeString("ka-GE")}
        </span>
      )}
    </div>
  );
}
