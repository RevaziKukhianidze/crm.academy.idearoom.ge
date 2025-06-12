export interface Review {
  id: number;
  text: string;
  fullName: string;
  course: string;
  courseLink: string;
  student_picture: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewFormData {
  text: string;
  fullName: string;
  course: string;
  courseLink: string;
  student_picture: string;
}
