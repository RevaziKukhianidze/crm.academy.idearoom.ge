"use client";

import { useState } from "react";
import { supabase } from "../../supabase/client";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { UserCircle, Upload, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface UserAvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarUpdated?: (url: string) => void;
}

export default function UserAvatarUpload({
  userId,
  currentAvatarUrl,
  onAvatarUpdated,
}: UserAvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    currentAvatarUrl || null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image.");
      }

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image size should be less than 2MB.");
      }

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const newAvatarUrl = data.publicUrl;

      // Update the user's avatar_url in the database
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(newAvatarUrl);
      if (onAvatarUpdated) {
        onAvatarUpdated(newAvatarUrl);
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during upload");
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="User avatar" />
        ) : (
          <AvatarFallback className="text-4xl">
            <UserCircle className="h-12 w-12" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="relative overflow-hidden"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Avatar
            </>
          )}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
          />
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
