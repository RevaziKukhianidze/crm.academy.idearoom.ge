export interface OfferedCourse {
  id?: number;
  created_at?: string;
  title: string;
  image?: string;
  lecturers: string[];
  lecturers_details: string[];
  course_details: string[];
  quantity_of_lessons: string;
  quantity_of_students?: string;
  price: number;
  old_price?: number;
  syllabus_title: string[];
  syllabus_content: string[][]; // Changed to string[][] for nested array format
  courseIcon?: string;
  text?: string;
  course_category: string[];
  discount_percentage?: string;
  lesson_time?: string;
  start_course?: string;
}

export interface OfferedCourseFormData
  extends Omit<OfferedCourse, "id" | "created_at"> {}
