export interface BlogTag {
  name: string;
  url?: string;
  follow?: "follow" | "nofollow";
}

export interface Blog {
  id: number;
  created_at: string;
  title: string;
  text: string;
  image?: string;
  image_file_path?: string;
  image_file_name?: string;
  linkTag?: (BlogTag | string)[];
}

export interface BlogFormData {
  title: string;
  text: string;
  image?: string;
  image_file_path?: string;
  image_file_name?: string;
  linkTag?: BlogTag[];
}
