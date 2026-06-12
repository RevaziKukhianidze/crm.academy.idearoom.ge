"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Search,
  Eye,
  Trash2,
  Mail,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { supabase } from "../../../../supabase/client";
import { checkAuthAndMock } from "@/utils/auth-mock";

interface SummerUserForm {
  id: number;
  created_at: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  socialid?: string;
  birth_date?: string;
  choosedCourse?: string;
  choosedMedia?: string;
}

const ITEMS_PER_PAGE = 15;

export default function SummerUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<SummerUserForm[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SummerUserForm[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<SummerUserForm | null>(null);
  const [userToDelete, setUserToDelete] = useState<SummerUserForm | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await checkAuthAndMock();
        if (!isAuthenticated) {
          router.replace("/");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Authentication check failed:", err);
        router.replace("/");
      }
    };
    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("summer_users_form")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching summer users:", error);
        if (error.message.includes('relation "public.summer_users_form" does not exist')) {
          setToast({
            message: "საზაფხულო სკოლის მომხმარებლების ტაბელი არ არსებობს. მიმართეთ ადმინისტრატორს.",
            type: "error",
          });
        }
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchUsers();

      const subscription = supabase
        .channel("summer_users_form_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "summer_users_form" },
          () => { fetchUsers(); }
        )
        .subscribe();

      return () => { subscription.unsubscribe(); };
    }
  }, [loading]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.socialid?.includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phoneNumber?.includes(searchTerm) ||
          user.choosedCourse?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [users, searchTerm]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleDelete = async (user: SummerUserForm) => {
    setDeleting(true);
    try {
      const { error, data } = await supabase
        .from("summer_users_form")
        .delete()
        .eq("id", user.id)
        .select();

      if (error) {
        setToast({ message: `შეცდომა: ${error.message}. ${error.details || ""}`, type: "error" });
      } else {
        setToast({
          message: `${user.firstName} ${user.lastName} წარმატებით წაიშალა`,
          type: "success",
        });
        setUserToDelete(null);
        await fetchUsers();
      }
    } catch (err) {
      setToast({
        message: `მოხდა შეცდომა: ${err instanceof Error ? err.message : "უცნობი შეცდომა"}`,
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "d MMM, yyyy", { locale: ka });
    } catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("isAuthenticated");
      router.push("/");
    } catch (err) {
      console.error("localStorage is not available:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="animate-spin h-5 w-5" />
          იტვირთება...
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{toast.message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToast(null)}
            className="h-6 w-6 p-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <main className="w-full min-h-[calc(100vh-73px)] bg-muted/30">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <GraduationCap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">საზაფხულო სკოლის რეგისტრანტები</h1>
                <p className="text-muted-foreground">
                  ნახეთ და მართეთ საზაფხულო სკოლაზე რეგისტრირებული მომხმარებლები
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/summer/summer_details">
                <Button variant="outline" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  კონტენტის მართვა
                </Button>
              </Link>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                განახლება
              </Button>
            </div>
          </div>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">სტატისტიკა</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{users.length}</div>
                  <div className="text-sm text-muted-foreground">სულ რეგისტრანტი</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{filteredUsers.length}</div>
                  <div className="text-sm text-muted-foreground">ფილტრირებული</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{totalPages}</div>
                  <div className="text-sm text-muted-foreground">გვერდი</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentUsers.length}</div>
                  <div className="text-sm text-muted-foreground">ამ გვერდზე</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                ძიება და ფილტრაცია
              </CardTitle>
              <CardDescription>
                იპოვეთ რეგისტრანტი პირადი ნომრით, სახელით, ელ-ფოსტით ან კურსის სახელით
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძიება... (პირადი ნომერი, სახელი, ელ-ფოსტა, კურსი)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  რეგისტრანტების სია{" "}
                  {searchTerm && `(ძიების შედეგი: "${searchTerm}")`}
                </CardTitle>
                {filteredUsers.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    გვერდი {currentPage} / {totalPages}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>სახელი</TableHead>
                      <TableHead>ელ-ფოსტა</TableHead>
                      <TableHead className="hidden md:table-cell">პირადი ნომერი</TableHead>
                      <TableHead className="hidden md:table-cell">კურსი</TableHead>
                      <TableHead className="hidden sm:table-cell">რეგისტრაცია</TableHead>
                      <TableHead className="text-right">მოქმედებები</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <div className="flex flex-col items-center gap-2">
                            <GraduationCap className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchTerm
                                ? "ძიების შედეგი ვერ მოიძებნა"
                                : "რეგისტრანტები ვერ მოიძებნა"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{user.firstName} {user.lastName}</span>
                              {user.phoneNumber && (
                                <span className="text-sm text-muted-foreground">
                                  {user.phoneNumber}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary">{user.socialid || "N/A"}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{user.choosedCourse || "N/A"}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {formatDate(user.created_at)}
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
                                <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  დეტალების ნახვა
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.open(`mailto:${user.email}`, "_blank")}
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

              {/* Pagination */}
              {filteredUsers.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    ნაჩვენებია {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} /{" "}
                    {filteredUsers.length}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      წინა
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (page > totalPages) return null;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      შემდეგი
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* User Details Dialog */}
      <Dialog
        open={selectedUser !== null}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        {selectedUser && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                რეგისტრანტის დეტალები
              </DialogTitle>
              <DialogDescription>
                სრული ინფორმაცია {selectedUser.firstName} {selectedUser.lastName}-ის შესახებ
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">სახელი</label>
                    <p className="text-sm">{selectedUser.firstName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">გვარი</label>
                    <p className="text-sm">{selectedUser.lastName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ელ-ფოსტა</label>
                    <p className="text-sm">{selectedUser.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ტელეფონი</label>
                    <p className="text-sm">{selectedUser.phoneNumber || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">პირადი ნომერი</label>
                    <Badge className="block w-fit">{selectedUser.socialid || "N/A"}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">დაბადების თარიღი</label>
                    <p className="text-sm">{formatDate(selectedUser.birth_date || "")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">არჩეული კურსი</label>
                    <Badge variant="outline" className="block w-fit">
                      {selectedUser.choosedCourse || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">მედია წყარო</label>
                    <p className="text-sm">{selectedUser.choosedMedia || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">რეგისტრაციის თარიღი</label>
                <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
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
              ეს მოქმედება ვერ გაუქმდება. რეგისტრანტის მონაცემები სამუდამოდ წაიშლება.
              {userToDelete && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">{userToDelete.email}</span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDelete(userToDelete)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  იშლება...
                </div>
              ) : (
                "წაშლა"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}