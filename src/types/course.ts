export interface Course {
  id: number;
  created_at: string;
  title: string;
  course_details?: string[];
  image?: string;
  image_file_path?: string;
  courseIcon?: string;
  start_course?: string;
  quantity_lessons?: number;
  quantity_of_students?: string;
  lesson_time?: number;
  lecturer?: string;
  lecturer_details?: string;
  price?: number;
  oldprice?: number;
  syllabus_title?: string[];
  syllabus_content?: string[][];
  section_image?: string;
}

export interface CourseFormData {
  title: string;
  course_details: string[];
  image: string;
  image_file_path: string;
  courseIcon: string;
  start_course: string;
  quantity_lessons: number;
  quantity_of_students: string;
  lesson_time: number;
  lecturer: string;
  lecturer_details: string;
  price: number;
  oldprice: number;
  syllabus_title: string[];
  syllabus_content: string[][];
  section_image: string;
}
