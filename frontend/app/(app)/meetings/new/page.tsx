"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardPaste, FileText, Music, Rocket, Users } from "lucide-react";
import { toast } from "sonner";

import { UploadDropzone } from "@/components/meetings/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { AUDIO_ACCEPT, MAX_AUDIO_MB, MAX_TRANSCRIPT_MB, MEETING_TYPES, TRANSCRIPT_ACCEPT } from "@/lib/constants";
import { peopleService } from "@/services/people";
import { meetingsService } from "@/services/meetings";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getErrorMessage, initials } from "@/lib/utils";

const meetingSchema = z.object({
  title: z.string().min(3, "Meeting title must be at least 3 characters."),
  meeting_date: z.string().min(1, "Meeting date is required."),
  meeting_type: z.string().min(1, "Select a meeting type."),
  notes: z.string().optional(),
});

type MeetingValues = z.infer<typeof meetingSchema>;

export default function NewMeetingPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [phase, setPhase] = useState<"form" | "uploading" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MeetingValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: { meeting_type: "meeting", meeting_date: new Date().toISOString().slice(0, 10) },
  });

  const peopleQuery = useQuery({
    queryKey: ["people", "all"],
    queryFn: () => peopleService.list({ page_size: 100 }),
  });

  const people = useMemo(() => peopleQuery.data?.results ?? [], [peopleQuery.data]);

  const toggleParticipant = (id: string) => {
    setParticipantIds((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id]
    );
  };

  const allSelected = people.length > 0 && participantIds.length === people.length;
  const selectAll = () => {
    if (allSelected) {
      setParticipantIds([]);
    } else {
      setParticipantIds(people.map((p) => p.id));
    }
  };

  const hasTranscript = Boolean(transcript) || transcriptText.trim().length > 0;

  const values = watch();
  const preview = {
    title: values.title || "Untitled meeting",
    date: values.meeting_date,
    type: MEETING_TYPES.find((t) => t.value === values.meeting_type)?.label ?? "Meeting",
    participants: people.filter((p) => participantIds.includes(p.id)),
  };

  const handleFileError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const onSubmit = async (values: MeetingValues) => {
    setError(null);
    setPhase("uploading");
    try {
      const meeting = await meetingsService.create(
        {
          title: values.title,
          meeting_date: values.meeting_date,
          meeting_type: values.meeting_type,
          notes: values.notes ?? "",
          participant_ids: participantIds,
          transcript,
          transcript_text: transcriptText.trim() || undefined,
          audio,
        },
        setUploadProgress
      );
      setPhase("success");
      if (hasTranscript) {
        toast.success("Meeting created. Starting AI analysis…");
        setTimeout(() => router.push(`/meetings/${meeting.id}/processing`), 1200);
      } else {
        toast.success("Meeting created. Add a transcript to start AI analysis.");
        setTimeout(() => router.push(`/meetings/${meeting.id}`), 1200);
      }
    } catch (err) {
      setPhase("form");
      setUploadProgress(0);
      const message = getErrorMessage(err, "We couldn't create this meeting. Please try again.");
      setError(message);
      toast.error(message);
    }
  };

  if (phase === "success") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <SuccessIcon />
        <h1 className="mt-6 text-2xl font-bold text-foreground">Meeting created successfully</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your files are stored securely. Redirecting to AI analysis…
        </p>
        <Spinner className="mt-6 h-6 w-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/meetings")} className="-ml-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Meetings
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">New Meeting</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Upload a transcript or a TXT file and IntelliConnect will turn it into actionable
          intelligence. Audio is optional — you can create a meeting without any files.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" /> Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="e.g. Project Alpha Planning"
                aria-invalid={Boolean(errors.title)}
                {...register("title")}
              />
              {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meeting_date">Meeting Date</Label>
                <Input id="meeting_date" type="date" {...register("meeting_date")} />
                {errors.meeting_date && <p className="text-xs text-danger">{errors.meeting_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_type">Meeting Type</Label>
                <Select id="meeting_type" {...register("meeting_type")}>
                  {MEETING_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Meeting Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Context you'd like the AI to consider…"
                className="min-h-[70px]"
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> Meeting Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <UploadDropzone
              id="transcript"
              label="Transcript (optional)"
              description="TXT, PDF, DOCX, SRT, VTT"
              accept={TRANSCRIPT_ACCEPT}
              maxSizeMB={MAX_TRANSCRIPT_MB}
              file={transcript}
              onFileChange={(f) => {
                setTranscript(f);
                setTranscriptText("");
                setError(null);
              }}
              onError={handleFileError}
            />

            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-border" aria-hidden="true" />
              <span className="relative z-10 mx-auto flex w-fit items-center gap-2 bg-background px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" /> or paste your transcript
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transcript_text">Paste Transcript Text</Label>
              <Textarea
                id="transcript_text"
                value={transcriptText}
                onChange={(e) => {
                  setTranscriptText(e.target.value);
                  if (e.target.value.trim()) {
                    setTranscript(null);
                  }
                  setError(null);
                }}
                placeholder={"Paste your meeting transcript here — with or without speaker names…\n\nPriya: Good morning, let's start.\nRavi: I'll walk everyone through the sprint status."}
                className="min-h-[140px] font-mono text-sm leading-relaxed"
                disabled={Boolean(transcript)}
              />
              <p className="text-xs text-muted-foreground">
                Pasted text is stored as a TXT transcript and analyzed exactly like an uploaded file.
                {transcriptText.length > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    {transcriptText.length.toLocaleString()} characters
                  </span>
                )}
              </p>
            </div>

            <UploadDropzone
              id="audio"
              label="Audio Recording (optional)"
              description="MP3, WAV, M4A"
              accept={AUDIO_ACCEPT}
              maxSizeMB={MAX_AUDIO_MB}
              file={audio}
              onFileChange={setAudio}
              onError={handleFileError}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Upload a transcript file <em>or</em> paste the transcript text to run AI analysis —
              or create the meeting now and add one later. Audio recordings are stored securely but
              aren&apos;t transcribed automatically.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" /> Participants
              <span className="text-sm font-normal text-muted-foreground">({participantIds.length} selected)</span>
            </CardTitle>
            {people.length > 0 && (
              <button
                type="button"
                onClick={selectAll}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition hover:bg-accent/60 hover:underline"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {allSelected ? "Clear all" : "Select all"}
              </button>
            )}
          </CardHeader>
          <CardContent>
            {peopleQuery.isLoading ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : people.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No people yet.{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => router.push("/people")}
                >
                  Add people
                </button>{" "}
                so AI can match tasks to the right person.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {people.map((person) => {
                  const selected = participantIds.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => toggleParticipant(person.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-primary/50 bg-accent/60"
                          : "border-border hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">{initials(person.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{person.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.department || "No department"}
                        </p>
                      </div>
                      {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" aria-hidden="true" /> Review & Submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{preview.title}</p>
                <Badge variant="secondary">{preview.type}</Badge>
                <span className="text-xs text-muted-foreground">{preview.date}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  {transcript
                    ? transcript.name
                    : transcriptText.trim()
                      ? `Pasted transcript (${transcriptText.trim().length.toLocaleString()} chars)`
                      : "No transcript selected"}
                </span>
                {audio && (
                  <span className="inline-flex items-center gap-1.5">
                    <Music className="h-3.5 w-3.5" aria-hidden="true" /> {audio.name}
                  </span>
                )}
                <span>
                  {preview.participants.length} {preview.participants.length === 1 ? "participant" : "participants"}
                </span>
              </div>
            </div>

            {phase === "uploading" ? (
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Uploading files… {uploadProgress}%
                </p>
              </div>
            ) : (
              <Button type="submit" variant="gradient" size="lg" className="w-full">
                {hasTranscript ? "Create Meeting & Start Analysis" : "Create Meeting"}
              </Button>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function SuccessIcon() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-sky-500/15 ring-1 ring-blue-500/25">
      <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
    </div>
  );
}
