export interface Blog {
  id: number;
  created_at: string;
  title: string;
  text: string;
  image?: string;
  image_file_path?: string;
  image_file_name?: string;
  tags?: string[];
}

export interface BlogFormData {
  title: string;
  text: string;
  image?: string;
  image_file_path?: string;
  image_file_name?: string;
  tags?: string[];
}
