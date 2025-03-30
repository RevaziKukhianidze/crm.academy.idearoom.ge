"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PencilIcon, Trash2Icon, ExternalLink, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface SliderItem {
  id: string;
  title: string | null;
  text: string | null;
  image: string | null;
  button_link: string | null;
  created_at: string;
}

interface SliderTableProps {
  initialSliderItems: SliderItem[];
}

export default function SliderTable({ initialSliderItems }: SliderTableProps) {
  const router = useRouter();
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Log when initialSliderItems changes
  useEffect(() => {
    console.log("SliderTable - initialSliderItems:", initialSliderItems);
    console.log(
      "SliderTable - initialSliderItems length:",
      initialSliderItems?.length || 0
    );

    // Safe way to handle initialSliderItems
    if (Array.isArray(initialSliderItems)) {
      setSliderItems(initialSliderItems);
    } else {
      console.warn(
        "SliderTable - initialSliderItems is not an array:",
        initialSliderItems
      );
      setSliderItems([]);
    }
  }, [initialSliderItems]);

  const handleEdit = (id: string) => {
    router.push(`/dashboard/sliders/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      // Use the API endpoint instead of direct Supabase call
      const response = await fetch(`/api/sliders?id=${itemToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete slider");
      }

      // Update local state after successful deletion
      setSliderItems(sliderItems.filter((item) => item.id !== itemToDelete));
      setDeleteError(null);
    } catch (err) {
      console.error("Error deleting slider item:", err);
      setDeleteError(
        err instanceof Error ? err.message : "Delete operation failed"
      );
    } finally {
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Debug rendering
  console.log("SliderTable - Rendering with items:", sliderItems?.length || 0);

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      {deleteError && (
        <div className="text-red-500 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 mb-6 rounded-r-md">
          {deleteError}
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="text-sm font-medium">მონაცემების სტატუსი:</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          ჩატვირთულია {sliderItems?.length || 0} სლაიდერი
        </p>
        {Array.isArray(sliderItems) && sliderItems.length > 0 ? (
          <p className="text-xs text-green-500">მონაცემები მიღებულია</p>
        ) : (
          <p className="text-xs text-amber-500">მონაცემები ვერ მოიძებნა</p>
        )}
      </div>

      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[120px]">სურათი</TableHead>
            <TableHead>სათაური</TableHead>
            <TableHead>ტექსტი</TableHead>
            <TableHead>ბმული</TableHead>
            <TableHead className="text-right">მოქმედებები</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!Array.isArray(sliderItems) || sliderItems.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-10 text-muted-foreground"
              >
                სლაიდერის ელემენტები არ მოიძებნა
              </TableCell>
            </TableRow>
          ) : (
            sliderItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell>
                  {item.image ? (
                    <div className="relative h-16 w-28 overflow-hidden rounded-md border">
                      <img
                        src={item.image}
                        alt={item.title || ""}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-28 items-center justify-center rounded-md border bg-muted/20">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {item.title || "—"}
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="line-clamp-2 text-sm text-muted-foreground">
                    {item.text || "—"}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {item.button_link ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={item.button_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-blue-600 hover:underline"
                          >
                            <span className="truncate max-w-[160px]">
                              {item.button_link}
                            </span>
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {item.button_link}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleEdit(item.id)}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setItemToDelete(item.id);
                        setDeleteDialogOpen(true);
                      }}
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              ეს მოქმედება წაშლის სლაიდერის ელემენტს და ვერ დაბრუნდება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>წაშლა</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
