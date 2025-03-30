"use client";

import { useState, useEffect } from "react";
import { OfferedCourse } from "@/types/offered-course";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  Search,
  Plus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase/client";

export default function OfferedCourseTable(props: {
  initialOfferedCourses: any[];
}) {
  const [offeredCourses, setOfferedCourses] = useState<any[]>(
    props.initialOfferedCourses || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Update courses when props change
    setOfferedCourses(props.initialOfferedCourses || []);
    // Reset to default sorting whenever new data comes in
    setSortField("created_at");
    setSortDirection("desc");
  }, [props.initialOfferedCourses]);

  useEffect(() => {
    // Set up realtime subscription
    const channel = supabase
      .channel("offered-courses-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offered_course",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // Add new courses at the beginning to maintain newest-first order
            setOfferedCourses((prev) => [payload.new as any, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOfferedCourses((prev) =>
              prev.map((course) =>
                course.id === payload.new.id ? (payload.new as any) : course
              )
            );
          } else if (payload.eventType === "DELETE") {
            setOfferedCourses((prev) =>
              prev.filter((course) => course.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter courses based on search term
  const filteredCourses = offeredCourses.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(course.course_category) &&
        course.course_category.some((cat: string) =>
          cat.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  // Debug the initial order
  console.log(
    "Filtered courses before sorting:",
    filteredCourses
      .slice(0, 3)
      .map((c) => ({ id: c.id, created_at: c.created_at }))
  );

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortField === "created_at") {
      const dateA = new Date(a[sortField] || "").getTime();
      const dateB = new Date(b[sortField] || "").getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }

    if (sortField === "title") {
      const valueA = a[sortField] || "";
      const valueB = b[sortField] || "";
      return sortDirection === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    }

    if (sortField === "id") {
      return sortDirection === "asc" ? a.id - b.id : b.id - a.id;
    }

    // Default case
    const valueA = a[sortField] || "";
    const valueB = b[sortField] || "";

    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    }

    return sortDirection === "asc"
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  // Debug the sorted order
  console.log(
    "Courses after sorting:",
    sortedCourses
      .slice(0, 3)
      .map((c) => ({ id: c.id, created_at: c.created_at }))
  );

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // For most fields, default to ascending order when first clicked
      // But for created_at field, default to descending (newest first)
      setSortDirection(field === "created_at" ? "desc" : "asc");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("დარწმუნებული ხართ, რომ გსურთ ამ შეთავაზების წაშლა?")) {
      setIsDeleting(id);
      try {
        const response = await fetch(`/api/offered-courses/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("შეთავაზების წაშლა ვერ მოხერხდა");
        }

        setOfferedCourses(offeredCourses.filter((course) => course.id !== id));
      } catch (error) {
        console.error("Error deleting offered course:", error);
        alert("შეთავაზების წაშლა ვერ მოხერხდა");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="მოძებნეთ სათაურით, აღწერით ან კატეგორიით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            <span className="hidden sm:inline">ფილტრი</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">სორტირება</span>
          </Button>
          <Button asChild className="flex items-center gap-2 ml-auto sm:ml-2">
            <Link href="/dashboard/offers/new">
              <Plus size={16} />
              <span className="hidden sm:inline">ახალი შეთავაზება</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-[80px]"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    ID
                    {sortField === "id" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("created_at")}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    შექმნის თარიღი
                    {sortField === "created_at" &&
                      (sortDirection === "desc" ? (
                        <div className="ml-1 text-xs">↓ უახლესი პირველი</div>
                      ) : (
                        <div className="ml-1 text-xs">↑ უძველესი პირველი</div>
                      ))}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("title")}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    სათაური
                    {sortField === "title" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>კატეგორია</TableHead>
                <TableHead>სურათი</TableHead>
                <TableHead>ფასი</TableHead>
                <TableHead>ფასდაკლება</TableHead>
                <TableHead>ლექტორები</TableHead>
                <TableHead>გაკვეთილები</TableHead>
                <TableHead className="text-right">მოქმედებები</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCourses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-40 text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
                      <p>შეთავაზებები ვერ მოიძებნა</p>
                      {searchTerm && (
                        <p className="text-sm text-muted-foreground">
                          შეცვალეთ საძიებო სიტყვა
                        </p>
                      )}
                      <Button asChild variant="outline" className="mt-2">
                        <Link href="/dashboard/offers/new">
                          <Plus size={16} className="mr-2" />
                          შექმენით პირველი შეთავაზება
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    className="group hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>{course.id}</TableCell>
                    <TableCell suppressHydrationWarning>
                      {new Date(course.created_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {course.title}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(course.course_category)
                        ? course.course_category.join(", ")
                        : course.course_category}
                    </TableCell>
                    <TableCell>
                      {course.image ? (
                        <div className="h-10 w-10 relative rounded-md overflow-hidden">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="object-cover h-full w-full"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {course.price ? `${course.price} ₾` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {course.discount_percentage
                        ? `${course.discount_percentage}%`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(course.lecturers)
                        ? course.lecturers.join(", ")
                        : course.lecturers}
                    </TableCell>
                    <TableCell>{course.quantity_of_lessons || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/offers/edit/${course.id}`}>
                            <Edit size={16} />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course.id)}
                          disabled={isDeleting === course.id}
                        >
                          <Trash2 size={16} />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
