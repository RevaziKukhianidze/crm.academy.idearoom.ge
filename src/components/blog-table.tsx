"use client";

import { useState, useEffect } from "react";
import { Blog } from "@/types/blog";
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
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  Search,
  Plus,
  Eye,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase/client";
import { toast } from "@/components/ui/use-toast";

interface BlogTableProps {
  initialBlogs: Blog[];
}

export default function BlogTable({ initialBlogs }: BlogTableProps) {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Blog>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const router = useRouter();

  // Sync initial blogs with state
  useEffect(() => {
    setBlogs(initialBlogs);
  }, [initialBlogs]);

  useEffect(() => {
    // Set up realtime subscription
    const channel = supabase
      .channel("blogs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blogs",
        },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              setBlogs((prev) => [payload.new as Blog, ...prev]);
              break;
            case "UPDATE":
              setBlogs((prev) =>
                prev.map((blog) =>
                  blog.id === payload.new.id ? (payload.new as Blog) : blog
                )
              );
              break;
            case "DELETE":
              setBlogs((prev) =>
                prev.filter((blog) => blog.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter blogs based on search term
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.tags &&
        blog.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  // Sort blogs
  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];

    // Handle undefined or null values
    if (valueA == null) return 1;
    if (valueB == null) return -1;

    if (sortField === "created_at") {
      return sortDirection === "asc"
        ? new Date(valueA as string).getTime() -
            new Date(valueB as string).getTime()
        : new Date(valueB as string).getTime() -
            new Date(valueA as string).getTime();
    }

    // For non-date values, convert to string for comparison
    const strA = valueA.toString().toLowerCase();
    const strB = valueB.toString().toLowerCase();
    return sortDirection === "asc"
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });

  const handleSort = (field: keyof Blog) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("დარწმუნებული ხართ, რომ გსურთ ამ ბლოგის წაშლა?")) {
      setIsDeleting(id);
      try {
        // Optimistic UI update
        const blogToDelete = blogs.find((blog) => blog.id === id);
        setBlogs((prev) => prev.filter((blog) => blog.id !== id));

        const { error } = await supabase.from("blogs").delete().eq("id", id);

        if (error) {
          console.error("ბლოგის წაშლის შეცდომა:", error);
          // აღვადგინოთ წაშლილი ბლოგი თუ შეცდომა დაფიქსირდა
          if (blogToDelete) {
            setBlogs((prev) => [...prev, blogToDelete]);
          }
          toast({
            title: "შეცდომა",
            description: "ბლოგის წაშლა ვერ მოხერხდა",
            variant: "destructive",
          });
        } else {
          toast({
            title: "წარმატება",
            description: "ბლოგი წარმატებით წაიშალა",
          });
          router.refresh();
        }
      } catch (err) {
        console.error("ბლოგის წაშლის შეცდომა:", err);
        toast({
          title: "შეცდომა",
          description: "ბლოგის წაშლისას დაფიქსირდა შეცდომა",
          variant: "destructive",
        });
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
            placeholder="მოძებნეთ ბლოგები სათაურით, შინაარსით ან ტეგებით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex w-full sm:w-auto">
          <Button asChild className="flex items-center gap-2 ml-auto">
            <Link href="/dashboard/blogs/new">
              <Plus size={16} />
              <span className="hidden sm:inline">ბლოგის დამატება</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/70">
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
                <TableHead onClick={() => handleSort("title")}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    სათაური
                    {sortField === "title" && (
                      <ArrowUpDown size={16} className="ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>შინაარსი</TableHead>
                <TableHead>სურათი</TableHead>
                <TableHead>ტეგები</TableHead>
                <TableHead className="text-right">მოქმედებები</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBlogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
                      <p>ბლოგები არ მოიძებნა</p>
                      {searchTerm && (
                        <p className="text-sm text-muted-foreground">
                          შეცვალეთ საძიებო სიტყვა
                        </p>
                      )}
                      <Button asChild variant="outline" className="mt-2">
                        <Link href="/dashboard/blogs/new">
                          <Plus size={16} className="mr-2" />
                          შექმენით პირველი ბლოგი
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedBlogs.map((blog) => (
                  <TableRow
                    key={blog.id}
                    className="group hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>{blog.id}</TableCell>
                    <TableCell suppressHydrationWarning>
                      {new Date(blog.created_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[220px] truncate font-medium">
                        {blog.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[220px] truncate text-sm text-muted-foreground">
                        {blog.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      {blog.image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="object-cover h-full w-full"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          არ არის
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {blog.tags && blog.tags.length > 0 ? (
                          blog.tags.map((tag, index) => (
                            <Badge
                              key={`${blog.id}-${index}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            არ არის
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          title="რედაქტირება"
                          className="h-8 w-8 p-0 rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        >
                          <Link href={`/dashboard/blogs/edit/${blog.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-md border-muted-foreground/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          onClick={() => handleDelete(blog.id)}
                          disabled={isDeleting === blog.id}
                          title="წაშლა"
                        >
                          {isDeleting === blog.id ? (
                            <div className="h-4 w-4 animate-spin">⏳</div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
