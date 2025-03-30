export interface Course {
  id: number;
  created_at: string;
  title: string;
  course_details?: string;
  image?: string;
  start_course?: string;
  quantity_lessons?: number;
  quantity_of_students?: string;
  lesson_time?: number;
}

export interface CourseFormData {
  title: string;
  course_details?: string;
  image?: string;
  image_file_path?: string;
  start_course?: string;
  quantity_lessons?: number;
  quantity_of_students?: string;
  lesson_time?: number;
}
