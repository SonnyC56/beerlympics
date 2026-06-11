"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Avatar,
  EmptyState,
  Sheet,
  Spinner,
  cx,
  useAction,
} from "@/components/primitives";
import { TeamCard, type TeamCardTeam } from "@/components/TeamCard";
import { ColorPicker, EmojiPicker } from "@/components/EmojiColorPicker";
import { Icon, Mascot, type IconName } from "@/components/Icon";
import { COLOR_TOKENS, colorHex } from "@/lib/teamColors";

type Guest = {
  _id: Id<"players">;
  name: string;
  emoji: string;
  status: "yes" | "no" | "maybe";
  plusOnes: number;
  note?: string;
  teamId?: Id<"teams">;
};

export default function TeamsPage() {
  const identity = useIdentity();
  const teams = useQuery(api.teams.list, {}) as TeamCardTeam[] | undefined;
  const event = useQuery(api.events.get, {});
  const guests = useQuery(api.rsvp.guests, {}) as Guest[] | undefined;
  const mine = useQuery(
    api.rsvp.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  );
  const run = useAction();

  const [view, setView] = useState<"teams" | "people">("teams");

  const leave = useMutation(api.teams.leave);
  const join = useMutation(api.teams.join);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamCardTeam | null>(null);

  if (teams === undefined) return <Spinner label="Loading the squads…" />;

  // Max players per team (counts the captain); host-set, defaults to 3.
  const cap = event?.settings?.maxTeamSize ?? 3;

  // `mine` is undefined while loading, null if no RSVP/event.
  const hasRsvp = !!mine?.player;
  const myUserId = identity.userId;
  const myTeamId: Id<"teams"> | null = mine?.player?.teamId ?? null;

  // Resolve my team either from rsvp.mine or by scanning rosters (fallback).
  const myTeam =
    teams.find((t) => t._id === myTeamId) ??
    (myUserId
      ? teams.find((t) => t.members.some((m) => m.userId === myUserId))
      : undefined) ??
    null;

  const otherTeams = teams.filter((t) => t._id !== myTeam?._id);
  const amCaptainOfMine =
    !!myTeam && !!myUserId &&
    myTeam.members.some((m) => m.userId === myUserId && m.role === "captain");
  const canEditMine = amCaptainOfMine || identity.isHost;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-medal">Teams</h1>
          <p className="mt-1 text-sm text-white/55">
            {teams.length} {teams.length === 1 ? "squad" : "squads"} in the arena
          </p>
        </div>
        <Icon name="flag" size={36} className="text-medal" />
      </div>

      {/* Teams / People toggle */}
      <div className="flex gap-1 rounded-full border border-white/10 bg-black/30 p-1">
        {(
          [
            { key: "teams", label: "Teams", icon: "flag" },
            { key: "people", label: "People", icon: "teams" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={cx(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition",
              view === t.key
                ? "bg-[var(--color-gold-500)] text-[#1a1205]"
                : "text-white/55 hover:text-white",
            )}
          >
            <Icon name={t.icon} size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Create / RSVP CTA */}
      {hasRsvp ? (
        !myTeam ? (
          <button
            className="btn btn-gold flex w-full items-center justify-center gap-2 py-4 text-base"
            onClick={() => setCreateOpen(true)}
          >
            <Icon name="plus" size={16} />
            Create a team
          </button>
        ) : null
      ) : (
        <div className="panel-tight flex items-center justify-between gap-3 p-4">
          <div className="text-sm text-white/70">
            RSVP to create or join a team.
          </div>
          <Link
            href="/rsvp"
            className="btn btn-gold flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm"
          >
            RSVP
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      )}

      {view === "teams" && (
        <>
      {/* Your team — pinned */}
      {myTeam && (
        <section className="space-y-2">
          <h2 className="px-1 font-display text-lg text-white/70">Your Team</h2>
          <TeamCard
            team={myTeam}
            highlight
            cap={cap}
            pinnedLabel="Your team"
            action={
              <>
                {canEditMine && (
                  <button
                    className="btn btn-ghost flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm"
                    onClick={() => setEditTeam(myTeam)}
                  >
                    <Icon name="edit" size={14} />
                    Edit
                  </button>
                )}
                <button
                  className="btn btn-ghost flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm text-[var(--color-loss)]"
                  onClick={() =>
                    run(
                      () => leave({ deviceId: identity.deviceId! }),
                      "Left the team.",
                    )
                  }
                  disabled={!identity.deviceId}
                >
                  <Icon name="arrowLeft" size={14} />
                  Leave team
                </button>
              </>
            }
          />
        </section>
      )}

      {/* All other teams */}
      <section className="space-y-3">
        {myTeam && otherTeams.length > 0 && (
          <h2 className="px-1 font-display text-lg text-white/70">
            Other Teams
          </h2>
        )}

        {teams.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon="flag"
              title="No teams yet"
              subtitle={
                hasRsvp
                  ? "Be the first to plant a flag. Create your squad and rally your crew."
                  : "RSVP first, then create the very first team."
              }
              action={
                hasRsvp ? (
                  <button
                    className="btn btn-gold flex items-center justify-center gap-2"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Icon name="plus" size={16} />
                    Create the first team
                  </button>
                ) : (
                  <Link
                    href="/rsvp"
                    className="btn btn-gold flex items-center justify-center gap-2"
                  >
                    <Icon name="beer" size={16} />
                    RSVP
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-4">
            {otherTeams.map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                cap={cap}
                action={
                  // Only show Join when the user has RSVP'd and has no team.
                  hasRsvp && !myTeam ? (
                    <button
                      className="btn btn-gold flex w-full items-center justify-center gap-2 px-3 py-2 text-sm"
                      onClick={() =>
                        run(
                          () =>
                            join({
                              deviceId: identity.deviceId!,
                              teamId: team._id,
                            }),
                          `Joined ${team.name}!`,
                        )
                      }
                      disabled={!identity.deviceId || team.members.length >= cap}
                    >
                      {team.members.length >= cap ? (
                        <>Team full ({team.members.length}/{cap})</>
                      ) : (
                        <>
                          <Icon name="plus" size={14} />
                          Join this team
                        </>
                      )}
                    </button>
                  ) : !hasRsvp ? (
                    <Link
                      href="/rsvp"
                      className="btn btn-ghost w-full px-3 py-2 text-sm"
                    >
                      RSVP to join
                    </Link>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer hint when on a team already */}
      {myTeam && teams.length > 1 && (
        <p className="px-1 text-center text-xs text-white/35">
          Leave your team to switch to another squad.
        </p>
      )}
        </>
      )}

      {/* People view */}
      {view === "people" && <PeopleView guests={guests} teams={teams} />}

      <TeamFormSheet
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
      />
      {editTeam && (
        <TeamFormSheet
          open={!!editTeam}
          mode="edit"
          team={editTeam}
          onClose={() => setEditTeam(null)}
        />
      )}
    </div>
  );
}

// ── Create / edit team sheet ──────────────────────────────────────────────────
function TeamFormSheet({
  open,
  mode,
  team,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  team?: TeamCardTeam;
  onClose: () => void;
}) {
  const identity = useIdentity();
  const run = useAction();
  const create = useMutation(api.teams.create);
  const update = useMutation(api.teams.update);
  const genFlagUrl = useMutation(api.teams.generateFlagUploadUrl);
  const setFlag = useMutation(api.teams.setFlag);
  const clearFlag = useMutation(api.teams.clearFlag);

  const [name, setName] = useState(team?.name ?? "");
  const [theme, setTheme] = useState(team?.theme ?? "");
  const [motto, setMotto] = useState(team?.motto ?? "");
  const [color, setColor] = useState(team?.color ?? COLOR_TOKENS[0]);
  const [emoji, setEmoji] = useState(team?.emoji ?? "lion");
  const [flagUrl, setFlagUrl] = useState<string | null>(team?.flagUrl ?? null);
  const [flagBusy, setFlagBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = name.trim().length > 0;

  async function uploadFlag(file: File) {
    if (!identity.deviceId || !team) return;
    setFlagBusy(true);
    await run(async () => {
      const url = await genFlagUrl({ deviceId: identity.deviceId! });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed — try a smaller image.");
      const { storageId } = (await res.json()) as { storageId: string };
      await setFlag({
        deviceId: identity.deviceId!,
        teamId: team._id,
        storageId: storageId as Id<"_storage">,
      });
      setFlagUrl(URL.createObjectURL(file));
    }, "Flag uploaded!");
    setFlagBusy(false);
  }

  async function removeFlag() {
    if (!identity.deviceId || !team) return;
    setFlagBusy(true);
    const ok = await run(
      () => clearFlag({ deviceId: identity.deviceId!, teamId: team._id }),
      "Flag removed.",
    );
    if (ok) setFlagUrl(null);
    setFlagBusy(false);
  }

  async function submit() {
    if (!identity.deviceId || !valid) return;
    if (mode === "create") {
      const ok = await run(
        () =>
          create({
            deviceId: identity.deviceId!,
            name: name.trim(),
            theme: theme.trim() || undefined,
            motto: motto.trim() || undefined,
            color,
            emoji,
          }),
        `${name.trim()} entered the arena!`,
      );
      if (ok) onClose();
    } else if (team) {
      const ok = await run(
        () =>
          update({
            deviceId: identity.deviceId!,
            teamId: team._id,
            patch: {
              name: name.trim(),
              theme: theme.trim(),
              motto: motto.trim(),
              color,
              emoji,
            },
          }),
        "Team updated!",
      );
      if (ok) onClose();
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Create a Team" : "Edit Team"}
    >
      <div className="space-y-5">
        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-2xl bg-white/4 p-3">
          <span
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl"
            style={{
              background: `${colorHex(color)}1f`,
              border: `1px solid ${colorHex(color)}66`,
            }}
          >
            {flagUrl ? (
              <img src={flagUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Mascot name={emoji} size={26} />
            )}
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-xl text-white">
              {name.trim() || "Team name"}
            </div>
            {(theme || motto) && (
              <div className="truncate text-xs text-white/55">
                {theme}
                {theme && motto ? " · " : ""}
                {motto ? `“${motto}”` : ""}
              </div>
            )}
          </div>
        </div>

        <FormField label="Team name">
          <input
            className="field"
            placeholder="The Hop Stars"
            value={name}
            maxLength={28}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4">
          <FormField label="Theme (optional)">
            <input
              className="field"
              placeholder="Pirates, neon, retro…"
              value={theme}
              maxLength={32}
              onChange={(e) => setTheme(e.target.value)}
            />
          </FormField>
          <FormField label="Motto (optional)">
            <input
              className="field"
              placeholder="Sip happens."
              value={motto}
              maxLength={48}
              onChange={(e) => setMotto(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={`Color`}>
          <ColorPicker value={color} onChange={setColor} />
        </FormField>

        <FormField label="Team mascot">
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </FormField>

        {mode === "edit" && team ? (
          <FormField label="Team flag (optional)">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFlag(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-3">
              <span
                className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{
                  background: `${colorHex(color)}1f`,
                  border: `1px solid ${colorHex(color)}55`,
                }}
              >
                {flagUrl ? (
                  <img
                    src={flagUrl}
                    alt="Team flag"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Mascot name={emoji} size={28} />
                )}
              </span>
              <div className="flex flex-1 flex-col gap-2">
                <button
                  type="button"
                  className="btn btn-ghost py-2 text-sm"
                  disabled={flagBusy || !identity.deviceId}
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Icon name="camera" size={14} />
                    {flagBusy
                      ? "Uploading…"
                      : flagUrl
                        ? "Replace flag"
                        : "Upload a flag"}
                  </span>
                </button>
                {flagUrl && (
                  <button
                    type="button"
                    className="text-xs text-[var(--color-loss)] underline disabled:opacity-50"
                    disabled={flagBusy}
                    onClick={removeFlag}
                  >
                    Remove flag
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-white/45">
              Shown instead of your mascot in the opening ceremony — the parade and
              the anthem flag wall.
            </p>
          </FormField>
        ) : (
          <p className="text-xs text-white/40">
            Want a custom flag image? Create your team first, then tap Edit to upload
            one for the opening ceremony.
          </p>
        )}

        <button
          className="btn btn-gold w-full"
          disabled={!valid || !identity.deviceId}
          onClick={submit}
        >
          <span className="flex items-center justify-center gap-2">
            <Icon name={mode === "create" ? "flag" : "save"} size={16} />
            {mode === "create" ? "Create team" : "Save changes"}
          </span>
        </button>
      </div>
    </Sheet>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-white/70">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── People view (the full guest roster, grouped by RSVP) ──────────────────────
function PeopleView({
  guests,
  teams,
}: {
  guests: Guest[] | undefined;
  teams: TeamCardTeam[];
}) {
  if (guests === undefined) return <Spinner label="Loading the guest list…" />;
  if (guests.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          icon="teams"
          title="No RSVPs yet"
          subtitle="Once people RSVP, the whole crew shows up here."
        />
      </div>
    );
  }

  const teamById = new Map(teams.map((t) => [t._id as string, t]));
  const roleByPlayer = new Map<string, "captain" | "member">();
  for (const t of teams)
    for (const m of t.members) roleByPlayer.set(m._id as string, m.role);

  const going = guests.filter((g) => g.status === "yes");
  const headcount = going.reduce((n, g) => n + 1 + (g.plusOnes ?? 0), 0);
  const needTeam = going.filter((g) => !g.teamId).length;

  const GROUPS: { key: Guest["status"]; label: string; icon: IconName }[] = [
    { key: "yes", label: "Going", icon: "check" },
    { key: "maybe", label: "Maybe", icon: "thinking" },
    { key: "no", label: "Can't make it", icon: "close" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat label="Going" value={going.length} />
        <SummaryStat label="Heads" value={headcount} />
        <SummaryStat
          label="Need a team"
          value={needTeam}
          tone={needTeam > 0 ? "gold" : undefined}
        />
      </div>

      {GROUPS.map((grp) => {
        const list = guests.filter((g) => g.status === grp.key);
        if (list.length === 0) return null;
        return (
          <section key={grp.key} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Icon
                name={grp.icon}
                size={16}
                className={
                  grp.key === "yes"
                    ? "text-[var(--color-win)]"
                    : grp.key === "no"
                      ? "text-white/35"
                      : "text-white/55"
                }
              />
              <h2 className="font-display text-lg text-white/80">{grp.label}</h2>
              <span className="chip">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((g) => {
                const team = g.teamId ? teamById.get(g.teamId as string) : undefined;
                const isCaptain = roleByPlayer.get(g._id as string) === "captain";
                return (
                  <div
                    key={g._id}
                    className="panel-tight flex items-center gap-3 p-3"
                  >
                    <Avatar emoji={g.emoji} size={36} color={team?.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-white">
                          {g.name}
                        </span>
                        {isCaptain && (
                          <Icon
                            name="crown"
                            size={13}
                            className="shrink-0 text-[var(--color-gold-300)]"
                          />
                        )}
                        {g.plusOnes > 0 && (
                          <span className="chip shrink-0">+{g.plusOnes}</span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs">
                        {team ? (
                          <Link
                            href={`/teams/${team._id}`}
                            className="inline-flex items-center gap-1 text-white/55 hover:text-white"
                          >
                            <Mascot name={team.emoji} size={13} /> {team.name}
                          </Link>
                        ) : g.status === "yes" ? (
                          <span className="text-[var(--color-gold-400)]">
                            Looking for a team
                          </span>
                        ) : (
                          <span className="text-white/35">No team</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "gold";
}) {
  return (
    <div className="panel-tight flex flex-col items-center py-3">
      <div
        className={cx(
          "font-display text-2xl",
          tone === "gold" ? "text-[var(--color-gold-400)]" : "text-white",
        )}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
    </div>
  );
}
