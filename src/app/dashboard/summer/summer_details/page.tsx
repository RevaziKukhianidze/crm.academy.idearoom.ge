"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "../../../../../supabase/client";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Settings,
  Users,
  Save,
  Edit2,
  GripVertical,
  Upload,
  Video,
  Image as ImageIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummerDetail {
  id?: number;
  title: string;
  start_course: string;
  qunatity_of_lessons: number;
  lesson_time: number;
  qunatity_of_students: string;
  location: string;
  price: number;
  old_price: number;
  course_details: string[];
  image: string;
  video_url: string;
  video_thumbnail: string;
}

interface Mentor {
  id?: number;
  name: string;
  description: string;
  sort_order: number;
}

type Lecture = string[];

interface Section {
  id?: number;
  name: string;
  lectures: Lecture[];
  sort_order: number;
  _expanded: boolean;
  _dirty: boolean;
}

type Toast = { type: "success" | "error"; message: string } | null;
type ActiveTab = "details" | "syllabus" | "mentors";

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const ok = toast.type === "success";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium max-w-sm
        ${ok ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
    >
      {ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 flex">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ setToast }: { setToast: (t: Toast) => void }) {
  const [detail, setDetail] = useState<SummerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("summer_details")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) setToast({ type: "error", message: "დეტალების ჩატვირთვა ვერ მოხერხდა" });
      setDetail(
        data ?? {
          title: "",
          start_course: "",
          qunatity_of_lessons: 10,
          lesson_time: 2,
          qunatity_of_students: "",
          location: "",
          price: 0,
          old_price: 0,
          course_details: [],
          image: "",
          video_url: "",
          video_thumbnail: "",
        }
      );
      setLoading(false);
    })();
  }, []);

  const uploadFile = async (
    file: File,
    type: "video" | "thumbnail",
  ): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("summer-videos")
      .upload(path, file, { upsert: true });
    if (error) {
      setToast({ type: "error", message: `ატვირთვა ვერ მოხერხდა: ${error.message}` });
      return null;
    }
    const { data } = supabase.storage.from("summer-videos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterUploading(true);
    const ext = file.name.split(".").pop();
    const path = `poster-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("course-images")
      .upload(path, file, { upsert: true });
    if (error) {
      setToast({ type: "error", message: `ატვირთვა ვერ მოხერხდა: ${error.message}` });
    } else {
      const { data } = supabase.storage.from("course-images").getPublicUrl(path);
      patch({ image: data.publicUrl });
      setToast({ type: "success", message: "პოსტერი აიტვირთა" });
    }
    setPosterUploading(false);
    e.target.value = "";
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    const url = await uploadFile(file, "video");
    if (url) { patch({ video_url: url }); setToast({ type: "success", message: "ვიდეო აიტვირთა" }); }
    setVideoUploading(false);
    e.target.value = "";
  };

  const handleThumbChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    const url = await uploadFile(file, "thumbnail");
    if (url) { patch({ video_thumbnail: url }); setToast({ type: "success", message: "თამბნეილი აიტვირთა" }); }
    setThumbUploading(false);
    e.target.value = "";
  };

  const patch = (updates: Partial<SummerDetail>) => {
    setDetail((prev) => (prev ? { ...prev, ...updates } : prev));
    setDirty(true);
  };

  const save = async () => {
    if (!detail) return;
    setSaving(true);
    const { id, ...payload } = detail;
    let error;

    if (id) {
      ({ error } = await supabase.from("summer_details").update(payload).eq("id", id));
    } else {
      const { data, error: e } = await supabase
        .from("summer_details")
        .insert(payload)
        .select("id")
        .single();
      error = e;
      if (data) setDetail((prev) => (prev ? { ...prev, id: data.id } : prev));
    }

    if (error) {
      setToast({ type: "error", message: "შენახვა ვერ მოხერხდა: " + error.message });
    } else {
      setDirty(false);
      setToast({ type: "success", message: "დეტალები შეინახა" });
    }
    setSaving(false);
  };

  if (loading || !detail) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> იტვირთება...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              ძირითადი ინფორმაცია
            </CardTitle>
            <Button onClick={save} disabled={saving || !dirty} size="sm" className="gap-2">
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> ინახება...</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> შენახვა</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">სათაური</Label>
              <Input
                id="title"
                value={detail.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="საზაფხულო სკოლა 2026"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_course">დაწყების თარიღი</Label>
                <Input
                  id="start_course"
                  value={detail.start_course}
                  onChange={(e) => patch({ start_course: e.target.value })}
                  placeholder="2026 წლის ივლისი"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">მდებარეობა</Label>
                <Input
                  id="location"
                  value={detail.location}
                  onChange={(e) => patch({ location: e.target.value })}
                  placeholder="ლა ვილა"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qunatity_of_lessons">შეხვედრების რაოდენობა</Label>
                <Input
                  id="qunatity_of_lessons"
                  type="number"
                  min="0"
                  value={detail.qunatity_of_lessons}
                  onChange={(e) => patch({ qunatity_of_lessons: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson_time">შეხვედრის ხანგრძლივობა (სთ)</Label>
                <Input
                  id="lesson_time"
                  type="number"
                  min="0"
                  value={detail.lesson_time}
                  onChange={(e) => patch({ lesson_time: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qunatity_of_students">სტუდენტების რაოდენობა</Label>
                <Input
                  id="qunatity_of_students"
                  value={detail.qunatity_of_students}
                  onChange={(e) => patch({ qunatity_of_students: e.target.value })}
                  placeholder="10 სტუდენტი"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label>პოსტერი (სურათი)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={posterUploading}
                    onClick={() => posterRef.current?.click()}
                    className="gap-2"
                  >
                    {posterUploading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> იტვირთება...</>
                      : <><Upload className="h-4 w-4" /> პოსტერის ატვირთვა</>}
                  </Button>
                  <input
                    ref={posterRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePosterChange}
                  />
                </div>
                {detail.image ? (
                  <div className="relative w-full rounded-md overflow-hidden border">
                    <img
                      src={detail.image}
                      alt="poster preview"
                      className="w-full h-52 object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 bg-black/50 text-white hover:bg-black/70"
                      onClick={() => patch({ image: "" })}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-52 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" strokeWidth={1} />
                    <span className="text-sm">პოსტერი არ არის არჩეული</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">ფასი (₾)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={detail.price}
                  onChange={(e) => patch({ price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="old_price">ძველი ფასი (₾)</Label>
                <Input
                  id="old_price"
                  type="number"
                  min="0"
                  value={detail.old_price}
                  onChange={(e) => patch({ old_price: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course details bullets */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">კურსის დეტალები</CardTitle>
            <Button onClick={save} disabled={saving || !dirty} size="sm" className="gap-2">
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> ინახება...</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> შენახვა</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(detail.course_details ?? []).map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const next = [...detail.course_details];
                  next[i] = e.target.value;
                  patch({ course_details: next });
                }}
                placeholder={`დეტალი ${i + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  patch({ course_details: detail.course_details.filter((_, idx) => idx !== i) });
                }}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => patch({ course_details: [...(detail.course_details ?? []), ""] })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> დეტალის დამატება
          </Button>
          <p className="text-xs text-muted-foreground">
            თითოეული ველი წარმოადგენს კურსის დეტალების სიის ერთ ელემენტს
          </p>
        </CardContent>
      </Card>

      {/* Video upload */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              ვიდეო
            </CardTitle>
            <Button onClick={save} disabled={saving || !dirty} size="sm" className="gap-2">
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> ინახება...</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> შენახვა</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Thumbnail */}
          <div className="space-y-3">
            <Label>თამბნეილი (სურათი)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={thumbUploading}
                onClick={() => thumbRef.current?.click()}
                className="gap-2"
              >
                {thumbUploading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> იტვირთება...</>
                  : <><Upload className="h-4 w-4" /> თამბნეილის ატვირთვა</>}
              </Button>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
            </div>
            {detail.video_thumbnail ? (
              <div className="relative w-full max-w-sm rounded-md overflow-hidden border">
                <img src={detail.video_thumbnail} alt="thumbnail preview" className="w-full h-40 object-cover" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => patch({ video_thumbnail: "" })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-sm h-40 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" strokeWidth={1} />
                <span className="text-sm">თამბნეილი არ არის არჩეული</span>
              </div>
            )}
          </div>

          {/* Video file */}
          <div className="space-y-3">
            <Label>ვიდეო ფაილი</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={videoUploading}
                onClick={() => videoRef.current?.click()}
                className="gap-2"
              >
                {videoUploading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> იტვირთება...</>
                  : <><Upload className="h-4 w-4" /> ვიდეოს ატვირთვა</>}
              </Button>
              <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={handleVideoChange} />
            </div>
            {detail.video_url ? (
              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                <Video className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate flex-1">{detail.video_url.split("/").pop()}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => patch({ video_url: "" })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-sm h-24 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Video className="h-7 w-7" strokeWidth={1} />
                <span className="text-sm">ვიდეო არ არის არჩეული</span>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// ─── Syllabus Tab ─────────────────────────────────────────────────────────────

function LectureCard({
  index,
  bullets,
  onChange,
  onRemove,
}: {
  index: number;
  bullets: string[];
  onChange: (b: string[]) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm font-medium">
          ლექცია {index + 1}
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            {bullets.length} პუნქტი
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>

      {open && (
        <div className="p-3 space-y-2 border-t">
          {bullets.map((b, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={b}
                onChange={(e) => { const n = [...bullets]; n[i] = e.target.value; onChange(n); }}
                placeholder={`პუნქტი ${i + 1}`}
                className="text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...bullets, ""])}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> პუნქტის დამატება
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSave,
  saving,
}: {
  section: Section;
  index: number;
  total: number;
  onChange: (s: Section) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const addLecture = () =>
    onChange({ ...section, lectures: [...section.lectures, [""]], _dirty: true });
  const updateLecture = (i: number, bullets: string[]) => {
    const next = [...section.lectures];
    next[i] = bullets;
    onChange({ ...section, lectures: next, _dirty: true });
  };
  const removeLecture = (i: number) =>
    onChange({ ...section, lectures: section.lectures.filter((_, idx) => idx !== i), _dirty: true });

  return (
    <div className={`border rounded-md overflow-hidden transition-colors ${section._dirty ? "border-primary/50" : ""}`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer select-none"
        onClick={() => onChange({ ...section, _expanded: !section._expanded })}
      >
        <span className="text-xs font-semibold text-muted-foreground bg-background border rounded px-1.5 py-0.5 min-w-[24px] text-center shrink-0">
          {index + 1}
        </span>
        <span className={`flex-1 text-sm font-medium ${!section.name ? "text-muted-foreground" : ""}`}>
          {section.name || "სათაური არ არის"}
        </span>
        <span className="text-xs text-muted-foreground bg-background border rounded-full px-2 py-0.5 shrink-0">
          {section.lectures.length} ლექცია
        </span>
        {section._dirty && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
            შეუნახავი
          </span>
        )}
        {section._expanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {/* Body */}
      {section._expanded && (
        <div className="p-4 border-t space-y-4">
          <div className="space-y-2">
            <Label>სექციის სახელი</Label>
            <Input
              value={section.name}
              onChange={(e) => onChange({ ...section, name: e.target.value, _dirty: true })}
              placeholder="მაგ. ვიდეო ედითინგი"
            />
          </div>

          <div className="space-y-2">
            <Label>ლექციები</Label>
            <div className="space-y-2">
              {section.lectures.map((lec, i) => (
                <LectureCard
                  key={i}
                  index={i}
                  bullets={lec}
                  onChange={(b) => updateLecture(i, b)}
                  onRemove={() => removeLecture(i)}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addLecture}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> ლექციის დამატება
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveUp}
                disabled={index === 0}
                className="gap-1.5"
              >
                <ChevronUp className="h-3.5 w-3.5" /> ზემოთ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveDown}
                disabled={index === total - 1}
                className="gap-1.5"
              >
                <ChevronDown className="h-3.5 w-3.5" /> ქვემოთ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="gap-1.5 text-destructive border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> წაშლა
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={saving || !section._dirty}
              className="gap-1.5"
            >
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> ინახება...</>
              ) : (
                <><CheckCircle2 className="h-3.5 w-3.5" /> შენახვა</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SyllabusTab({ setToast }: { setToast: (t: Toast) => void }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("summer_syllabus")
        .select("id, name, lectures, sort_order")
        .order("sort_order", { ascending: true });
      if (error) setToast({ type: "error", message: "სილაბუსის ჩატვირთვა ვერ მოხერხდა" });
      else
        setSections(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            lectures: row.lectures as Lecture[],
            sort_order: row.sort_order,
            _expanded: false,
            _dirty: false,
          }))
        );
      setLoading(false);
    })();
  }, []);

  const updateSection = useCallback(
    (index: number, updated: Section) =>
      setSections((prev) => prev.map((s, i) => (i === index ? updated : s))),
    []
  );

  const addSection = () => {
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order), -1);
    setSections((prev) => [
      ...prev,
      { name: "", lectures: [[""]], sort_order: maxOrder + 1, _expanded: true, _dirty: true },
    ]);
  };

  const removeSection = async (index: number) => {
    const section = sections[index];
    if (section.id) {
      const { error } = await supabase.from("summer_syllabus").delete().eq("id", section.id);
      if (error) { setToast({ type: "error", message: "წაშლა ვერ მოხერხდა" }); return; }
    }
    setSections((prev) => prev.filter((_, i) => i !== index));
    setToast({ type: "success", message: "სექცია წაიშალა" });
  };

  const moveSection = (index: number, dir: "up" | "down") => {
    setSections((prev) => {
      const next = [...prev];
      const swap = dir === "up" ? index - 1 : index + 1;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next.map((s, i) => ({ ...s, sort_order: i, _dirty: true }));
    });
  };

  const saveSection = async (index: number) => {
    const section = sections[index];
    setSavingId(index);
    const cleanLectures = section.lectures
      .map((lec) => lec.filter((b) => b.trim() !== ""))
      .filter((lec) => lec.length > 0);
    const payload = { name: section.name.trim(), lectures: cleanLectures, sort_order: section.sort_order };
    let error;
    let savedId = section.id;

    if (section.id) {
      ({ error } = await supabase.from("summer_syllabus").update(payload).eq("id", section.id));
    } else {
      const { data, error: e } = await supabase
        .from("summer_syllabus")
        .insert(payload)
        .select("id")
        .single();
      error = e;
      if (data) savedId = data.id;
    }

    if (error) setToast({ type: "error", message: "შენახვა ვერ მოხერხდა: " + error.message });
    else {
      setSections((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, id: savedId, lectures: cleanLectures, _dirty: false } : s
        )
      );
      setToast({ type: "success", message: `"${payload.name}" შეინახა` });
    }
    setSavingId(null);
  };

  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const unsavedCount = sections.filter((s) => s._dirty).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "სექცია", value: sections.length },
          { label: "ლექცია სულ", value: totalLectures },
          { label: "შეუნახავი", value: unsavedCount },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sections */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              სექციები
            </CardTitle>
            <Button onClick={addSection} size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" /> სექციის დამატება
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> სილაბუსი იტვირთება...
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center py-12 border border-dashed rounded-md gap-3">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">სილაბუსი ცარიელია</p>
              <Button variant="outline" onClick={addSection} className="gap-2">
                <Plus className="h-4 w-4" /> პირველი სექციის დამატება
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, i) => (
                <SectionCard
                  key={section.id ?? `new-${i}`}
                  section={section}
                  index={i}
                  total={sections.length}
                  onChange={(updated) => updateSection(i, updated)}
                  onRemove={() => removeSection(i)}
                  onMoveUp={() => moveSection(i, "up")}
                  onMoveDown={() => moveSection(i, "down")}
                  onSave={() => saveSection(i)}
                  saving={savingId === i}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Mentors Tab ──────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", description: "" };

function MentorsTab({ setToast }: { setToast: (t: Toast) => void }) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<"new" | number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchMentors = useCallback(async () => {
    const { data, error } = await supabase
      .from("summer_mentors")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) setToast({ type: "error", message: "მენტორების ჩატვირთვა ვერ მოხერხდა" });
    else setMentors(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const startAdd = () => { setEditingId("new"); setForm(EMPTY_FORM); };
  const startEdit = (m: Mentor) => { setEditingId(m.id!); setForm({ name: m.name, description: m.description }); };
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); };

  const saveMentor = async () => {
    if (!form.name.trim()) { setToast({ type: "error", message: "სახელი სავალდებულოა" }); return; }
    setSaving(true);
    if (editingId === "new") {
      const { error } = await supabase.from("summer_mentors").insert({
        name: form.name.trim(), description: form.description.trim(), sort_order: mentors.length,
      });
      if (error) setToast({ type: "error", message: "დამატება ვერ მოხერხდა: " + error.message });
      else { setToast({ type: "success", message: "მენტორი დაემატა" }); cancelEdit(); await fetchMentors(); }
    } else {
      const { error } = await supabase
        .from("summer_mentors")
        .update({ name: form.name.trim(), description: form.description.trim() })
        .eq("id", editingId);
      if (error) setToast({ type: "error", message: "შენახვა ვერ მოხერხდა: " + error.message });
      else { setToast({ type: "success", message: "მენტორი განახლდა" }); cancelEdit(); await fetchMentors(); }
    }
    setSaving(false);
  };

  const deleteMentor = async (id: number) => {
    setDeletingId(id);
    const { error } = await supabase.from("summer_mentors").delete().eq("id", id);
    if (error) setToast({ type: "error", message: "წაშლა ვერ მოხერხდა" });
    else { setToast({ type: "success", message: "მენტორი წაიშალა" }); await fetchMentors(); }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Add / edit form */}
      {editingId !== null && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {editingId === "new" ? "ახალი მენტორი" : "მენტორის რედაქტირება"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mentor-name">სახელი</Label>
              <Input
                id="mentor-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="მენტორის სახელი და გვარი"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentor-desc">აღწერა</Label>
              <Textarea
                id="mentor-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="მენტორის შესახებ..."
                rows={5}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={saveMentor} disabled={saving} className="gap-2">
                {saving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> ინახება...</>
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> შენახვა</>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit}>
                გაუქმება
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              მენტორები
            </CardTitle>
            {editingId === null && (
              <Button onClick={startAdd} size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" /> მენტორის დამატება
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> იტვირთება...
            </div>
          ) : mentors.length === 0 ? (
            <div className="flex flex-col items-center py-12 border border-dashed rounded-md gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">მენტორები არ არიან დამატებული</p>
              <Button variant="outline" onClick={startAdd} className="gap-2">
                <Plus className="h-4 w-4" /> პირველი მენტორის დამატება
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>სახელი</TableHead>
                    <TableHead className="hidden md:table-cell">აღწერა</TableHead>
                    <TableHead className="text-right">მოქმედებები</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentors.map((mentor, i) => (
                    <TableRow key={mentor.id}>
                      <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                      <TableCell className="font-medium">{mentor.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground max-w-md">
                        <span className="line-clamp-2 text-sm">{mentor.description || "—"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(mentor)}
                            className="gap-1.5"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> რედ.
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMentor(mentor.id!)}
                            disabled={deletingId === mentor.id}
                            className="gap-1.5 text-destructive border-destructive/40 hover:text-destructive"
                          >
                            {deletingId === mentor.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            წაშლა
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SummerDetailsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem("isAuthenticated")) router.replace("/");
      else setAuthLoading(false);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleLogout = () => {
    try { localStorage.removeItem("isAuthenticated"); } catch {}
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> იტვირთება...
        </div>
      </div>
    );
  }

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: "details", label: "დეტალები", icon: <Settings className="h-4 w-4" /> },
    { key: "syllabus", label: "სილაბუსი", icon: <BookOpen className="h-4 w-4" /> },
    { key: "mentors", label: "მენტორები", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <>
      <DashboardNavbar handleLogOut={handleLogout} />

      <main className="w-full min-h-[calc(100vh-73px)] bg-muted/30">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-6">

          {/* Page header */}
          <div>
            <h1 className="text-3xl font-bold">საზაფხულო სკოლა — კონტენტი</h1>
            <p className="text-muted-foreground mt-1">
              დეტალების, სილაბუსისა და მენტორების მართვა
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b">
            {tabs.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "details" && <DetailsTab setToast={setToast} />}
          {activeTab === "syllabus" && <SyllabusTab setToast={setToast} />}
          {activeTab === "mentors" && <MentorsTab setToast={setToast} />}
        </div>
      </main>

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
