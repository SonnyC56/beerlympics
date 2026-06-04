"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { Avatar, Sheet, TeamBadge, cx, useToast } from "@/components/primitives";
import { Icon } from "@/components/Icon";

type TeamLite = { _id: Id<"teams">; name: string; emoji: string; color: string };
type Stage = "idle" | "uploading" | "saving";

/**
 * Capture + upload photos/videos. Supports a live in-browser camera
 * (getUserMedia + MediaRecorder) and a file-upload fallback, and can tag the
 * media to a specific match / game / team.
 */
export function MediaCapture({
  className,
  matchId,
  gameId,
  teamId: lockedTeamId,
  variant = "hero",
  label,
}: {
  className?: string;
  matchId?: Id<"matches">;
  gameId?: Id<"games">;
  teamId?: Id<"teams">;
  variant?: "hero" | "chip";
  label?: string;
}) {
  const identity = useIdentity();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const record = useMutation(api.media.record);
  const mine = useQuery(
    api.rsvp.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  );
  const teams = useQuery(api.teams.list, {}) as TeamLite[] | undefined;
  const myTeamId = mine?.player?.teamId ?? null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [teamId, setTeamId] = useState<Id<"teams"> | "">("");
  const [stage, setStage] = useState<Stage>("idle");

  const canUpload = !!identity.deviceId && identity.hasProfile;
  const busy = stage !== "idle";
  const isVideo = pending?.type.startsWith("video") ?? false;

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPending(null);
    setPreview(null);
    setCaption("");
    setTeamId("");
    setStage("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  function takeFile(file: File) {
    setPending(file);
    setPreview(URL.createObjectURL(file));
    setTeamId(lockedTeamId ?? myTeamId ?? "");
    setCaption("");
    setMenuOpen(false);
    setCamOpen(false);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) takeFile(file);
  }

  async function commit() {
    if (!pending || !identity.deviceId) return;
    const file = pending;
    try {
      setStage("uploading");
      const url = await generateUploadUrl({ deviceId: identity.deviceId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed — try again.");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      setStage("saving");
      await record({
        deviceId: identity.deviceId,
        storageId,
        kind: file.type.startsWith("video") ? "video" : "photo",
        caption: caption.trim() || undefined,
        teamId: teamId || undefined,
        gameId,
        matchId,
        takenAt: file.lastModified || Date.now(),
      });
      toast(file.type.startsWith("video") ? "Clip added!" : "Shot added!", "ok");
      reset();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "err");
      setStage("idle");
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />

      {variant === "hero" ? (
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          disabled={!canUpload}
          className={cx(
            "panel stadium-grid relative flex w-full flex-col items-center gap-2 overflow-hidden px-6 py-7 text-center transition",
            canUpload ? "hover:brightness-110 active:scale-[0.99]" : "opacity-60",
          )}
        >
          <span className="pointer-events-none absolute -right-6 -top-6 opacity-10">
            <Icon name="camera" size={110} />
          </span>
          <span className="relative animate-float text-medal">
            <Icon name="camera" size={48} />
          </span>
          <span className="relative font-display text-2xl text-medal">{label ?? "Capture the Moment"}</span>
          <span className="relative text-sm text-white/60">Live camera or upload — photo or video</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          disabled={!canUpload}
          className="btn btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-50"
        >
          <Icon name="camera" size={14} /> {label ?? "Add photo / video"}
        </button>
      )}

      {!canUpload && variant === "hero" && (
        <p className="mt-2 text-center text-xs text-[var(--color-gold-300)]">
          Set your name (top-right) before adding to the reel.
        </p>
      )}

      {/* source picker */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Add a photo or video">
        <div className="space-y-2.5">
          <button className="btn btn-gold flex w-full items-center justify-center gap-2 py-3.5" onClick={() => { setMenuOpen(false); setCamOpen(true); }}>
            <Icon name="video" size={18} /> Use the camera
          </button>
          <button className="btn btn-ghost flex w-full items-center justify-center gap-2 py-3.5" onClick={() => { setMenuOpen(false); inputRef.current?.click(); }}>
            <Icon name="image" size={18} /> Choose from library
          </button>
          <p className="pt-1 text-center text-xs text-white/40">
            Everything is auto-timestamped{matchId ? " and tagged to this match" : ""}.
          </p>
        </div>
      </Sheet>

      {camOpen && (
        <LiveCamera onFile={takeFile} onClose={() => setCamOpen(false)} />
      )}

      {/* confirm + tag + upload */}
      <Sheet open={!!pending} onClose={() => !busy && reset()} title={isVideo ? "Add a clip" : "Add a photo"}>
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            {preview ? (
              isVideo ? (
                <video src={preview} controls playsInline className="max-h-[42dvh] w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="max-h-[42dvh] w-full object-contain" />
              )
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <Avatar emoji={identity.user?.emoji ?? "beer"} size={26} />
            Posting as <span className="font-semibold text-white/85">{identity.user?.name ?? "you"}</span>
          </div>

          <input
            className="field"
            placeholder="Caption (optional)"
            value={caption}
            maxLength={120}
            disabled={busy}
            onChange={(e) => setCaption(e.target.value)}
          />

          {!lockedTeamId && teams && teams.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">Tag a team (optional)</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setTeamId("")}
                  className={cx("chip", teamId === "" ? "ring-1 ring-[var(--color-gold-500)] text-[var(--color-gold-300)]" : "")}
                >
                  None
                </button>
                {teams.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    disabled={busy}
                    onClick={() => setTeamId(t._id)}
                    className={cx(
                      "rounded-full border px-3 py-1.5 transition",
                      teamId === t._id ? "border-white/30 bg-white/10" : "border-white/10 bg-white/4",
                    )}
                  >
                    <TeamBadge emoji={t.emoji} name={t.name} color={t.color} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button className="btn btn-ghost flex-1" onClick={reset} disabled={busy}>Cancel</button>
            <button className="btn btn-gold flex-1" onClick={commit} disabled={busy}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
                  {stage === "saving" ? "Saving…" : "Uploading…"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="rocket" size={16} /> Post
                </span>
              )}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

// ── Live camera overlay ──────────────────────────────────────────────────────
function LiveCamera({ onFile, onClose }: { onFile: (f: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setErr("Couldn't open the camera. Use “Choose from library” instead, or check browser permissions.");
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function takePhoto() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        onFile(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  function startRec() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find(
      (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
    );
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const type = rec.mimeType || "video/webm";
      const ext = type.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type });
      stopStream();
      onFile(new File([blob], `video-${Date.now()}.${ext}`, { type }));
    };
    rec.start();
    recorderRef.current = rec;
    setSeconds(0);
    setRecording(true);
  }

  function stopRec() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => { stopStream(); onClose(); }} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
          <Icon name="close" size={14} /> Close
        </button>
        {recording && (
          <span className="flex items-center gap-2 rounded-full bg-[var(--color-live)]/20 px-3 py-1 text-sm font-bold text-[var(--color-live)]">
            <span className="live-dot" /> {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </span>
        )}
        <button onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
          <Icon name="refresh" size={14} /> Flip
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {err ? (
          <div className="flex h-full items-center justify-center px-8 text-center text-sm text-white/70">{err}</div>
        ) : (
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        )}
      </div>

      {!err && (
        <div className="flex items-center justify-center gap-8 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <button
            onClick={takePhoto}
            disabled={recording}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 text-white disabled:opacity-40"
            aria-label="Take photo"
          >
            <Icon name="camera" size={28} />
          </button>
          <button
            onClick={recording ? stopRec : startRec}
            className={cx(
              "flex h-16 w-16 items-center justify-center rounded-full border-4 transition",
              recording ? "border-white bg-[var(--color-live)]" : "border-[var(--color-live)] bg-white/10",
            )}
            aria-label={recording ? "Stop recording" : "Record video"}
          >
            <span className={cx("bg-[var(--color-live)]", recording ? "h-5 w-5 rounded-sm bg-white" : "h-7 w-7 rounded-full")} />
          </button>
        </div>
      )}
    </div>
  );
}
