"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Mail,
  Trash2,
  Eye,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import Link from "next/link";
import { supabase } from "../../supabase/client";

export default function UserFormTable({ usersFormData, onUserUpdate }) {
  const [openDetailId, setOpenDetailId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (user) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("users_form")
        .delete()
        .eq("id", user.id);

      if (error) {
        console.error("Error deleting submission:", error);
        alert("მომხმარებლის წაშლა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.");
      } else {
        setUserToDelete(null);
        if (onUserUpdate) {
          onUserUpdate(); // Callback to refresh data
        }
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("მომხმარებლის წაშლა ვერ მოხერხდა.");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewDetails = (user) => {
    setUserDetails(user);
    setOpenDetailId(user.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "d MMM, yyyy", { locale: ka });
    } catch (e) {
      return dateString;
    }
  };

  const displayedUsers = usersFormData.slice(0, 5); // Show only first 5 users
  const hasMoreUsers = usersFormData.length > 5;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>სახელი</TableHead>
              <TableHead>ელ-ფოსტა</TableHead>
              <TableHead className="hidden md:table-cell">
                პირადი ნომერი
              </TableHead>
              <TableHead className="hidden md:table-cell">კურსი</TableHead>
              <TableHead className="hidden sm:table-cell">
                რეგისტრაცია
              </TableHead>
              <TableHead className="text-right">მოქმედებები</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      მომხმარებლების მოთხოვნები არ მოიძებნა
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                      {user.phoneNumber && (
                        <span className="text-sm text-muted-foreground sm:hidden">
                          {user.phoneNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{user.email || "N/A"}</span>
                      {user.phoneNumber && (
                        <span className="text-sm text-muted-foreground hidden sm:block md:hidden">
                          {user.phoneNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="font-mono">
                      {user.socialId || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">
                      {user.choosedCourse || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(user.birth_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">მენიუს გახსნა</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>მოქმედებები</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          დეტალების ნახვა
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`mailto:${user.email}`, "_blank")
                          }
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          ელ-ფოსტის გაგზავნა
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setUserToDelete(user)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          წაშლა
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Show more users link */}
      {hasMoreUsers && (
        <div className="mt-4 text-center">
          <Link href="/dashboard/users">
            <Button
              variant="outline"
              className="flex items-center gap-2 mx-auto"
            >
              ყველა მომხმარებლის ნახვა ({usersFormData.length})
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog
        open={openDetailId !== null}
        onOpenChange={(open) => !open && setOpenDetailId(null)}
      >
        {userDetails && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                მომხმარებლის დეტალები
              </DialogTitle>
              <DialogDescription>
                სრული ინფორმაცია {userDetails.firstName} {userDetails.lastName}
                -ის შესახებ
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      სახელი
                    </label>
                    <p className="text-sm">{userDetails.firstName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      გვარი
                    </label>
                    <p className="text-sm">{userDetails.lastName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      ელ-ფოსტა
                    </label>
                    <p className="text-sm">{userDetails.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      ტელეფონი
                    </label>
                    <p className="text-sm">
                      {userDetails.phoneNumber || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      პირადი ნომერი
                    </label>
                    <Badge className="block w-fit">
                      {userDetails.socialId || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      დაბადების თარიღი
                    </label>
                    <p className="text-sm">
                      {formatDate(userDetails.birth_date || "")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      არჩეული კურსი
                    </label>
                    <Badge variant="outline" className="block w-fit">
                      {userDetails.choosedCourse || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      მედია წყარო
                    </label>
                    <p className="text-sm">
                      {userDetails.choosedMedia || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  რეგისტრაციის თარიღი
                </label>
                <p className="text-sm">{formatDate(userDetails.created_at)}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              ეს მოქმედება ვერ გაუქმდება. მომხმარებლის მონაცემები სამუდამოდ
              წაიშლება.
              {userToDelete && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>
                    {userToDelete.firstName} {userToDelete.lastName}
                  </strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {userToDelete.email}
                  </span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDelete(userToDelete)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "იშლება..." : "წაშლა"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
