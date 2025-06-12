"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Review } from "@/types/review";
import { supabase } from "../../supabase/client";
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ReviewTableProps {
  initialReviews: Review[];
}

export default function ReviewTable({ initialReviews }: ReviewTableProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Review>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Update reviews when initialReviews prop changes
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Filter reviews based on search term
  const filteredReviews = reviews.filter(
    (review) =>
      review.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: keyof Review) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      const { error } = await supabase.from("review").delete().eq("id", id);

      if (error) {
        console.error("Error deleting review:", error);
        alert("შეფასების წაშლისას მოხდა შეცდომა");
      } else {
        setReviews(reviews.filter((review) => review.id !== id));
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("შეფასების წაშლისას მოხდა შეცდომა");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ka-GE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="მოძებნეთ სახელით, კურსით ან შეფასებით..."
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
            <Link href="/dashboard/reviews/new">
              <Plus size={16} />
              <span className="hidden sm:inline">ახალი შეფასება</span>
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
                    {sortField === "created_at" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("fullName")}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    სტუდენტის სახელი
                    {sortField === "fullName" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>სტუდენტის სურათი</TableHead>
                <TableHead onClick={() => handleSort("course")}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    კურსი
                    {sortField === "course" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>შეფასება</TableHead>
                <TableHead className="text-right">მოქმედებები</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReviews.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
                      <p>შეფასებები ვერ მოიძებნა</p>
                      {searchTerm && (
                        <p className="text-sm text-muted-foreground">
                          შეცვალეთ საძიებო სიტყვა
                        </p>
                      )}
                      <Button asChild variant="outline" className="mt-2">
                        <Link href="/dashboard/reviews/new">
                          <Plus size={16} className="mr-2" />
                          შექმენით პირველი შეფასება
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedReviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{review.id}</TableCell>
                    <TableCell>{formatDate(review.created_at)}</TableCell>
                    <TableCell className="font-medium">
                      {review.fullName}
                    </TableCell>
                    <TableCell>
                      {review.student_picture ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={review.student_picture}
                            alt={`${review.fullName}-ს სურათი`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">
                            სურათი არ არის
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {review.courseLink ? (
                        <Link
                          href={review.courseLink}
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          {review.course}
                        </Link>
                      ) : (
                        review.course
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Eye size={14} className="mr-1" />
                            {truncateText(review.text, 50)}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {review.fullName}-ს შეფასება
                            </DialogTitle>
                            <DialogDescription>
                              კურსი: {review.course}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              შეფასება:
                            </p>
                            <p className="text-base leading-relaxed">
                              {review.text}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/reviews/${review.id}/edit`}>
                            <Edit size={14} className="mr-1" />
                            რედაქტირება
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isDeleting === review.id}
                            >
                              <Trash2 size={14} className="mr-1" />
                              წაშლა
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ნამდვილად გსურთ შეფასების წაშლა?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                ეს მოქმედება შეუძლებელი იქნება უკან დაბრუნება.
                                შეფასება სამუდამოდ წაიშლება.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(review.id)}
                                disabled={isDeleting === review.id}
                              >
                                {isDeleting === review.id
                                  ? "იშლება..."
                                  : "წაშლა"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
