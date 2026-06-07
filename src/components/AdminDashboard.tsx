/**
 * AdminDashboard.tsx — research / admin view.
 *
 * Shows every student's learning progress (synced to Supabase via syncProgress).
 * Reachable only when logged in as a designated admin (see ADMIN_USERNAMES).
 * Mobile-only, dark-first, matches the app's visual language.
 *
 * Access note: the admin gate is client-side only (open RLS) — fine for a
 * closed research pilot, not hardened access control. See supabase/admin.sql.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft, RefreshCw, Users, Target, Flame, GraduationCap,
  Download, ChevronDown, School as SchoolIcon, AlertTriangle, WifiOff,
  TrendingUp, TrendingDown, Sparkles,
} from "lucide-react";
import {
  fetchAllProgress, fetchAllHistory, isAdminUsername, SUPABASE_ENABLED,
  StudentProgressRow, StudentProgressHistoryRow,
} from "../lib/supabase";
import { TIER_CONFIG, MASTERY_NAMES, MASTERY_COLORS, RIBBONS } from "../constants";
import { LeagueTier } from "../types";

interface Props {
  /** Optional — when omitted (e.g. embedded in the admin console) no back chevron is shown. */
  onBack?: () => void;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmtDelta = (d: number) => `${d >= 0 ? "+" : ""}${Math.round(d * 100)}pp`;
const fmtDeltaPts = (d: number) => `${d >= 0 ? "+" : ""}${Math.round(d)}`;

export default function AdminDashboard({ onBack }: Props) {
  const [rows, setRows] = useState<StudentProgressRow[]>([]);
  const [history, setHistory] = useState<StudentProgressHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cohortKey, setCohortKey] = useState<string>("all"); // "all" | school | age-bucket
  const today = new Date().toDateString();

  const load = async () => {
    setLoading(true);
    const [data, hist] = await Promise.all([fetchAllProgress(), fetchAllHistory()]);
    setRows(data.filter(r => !isAdminUsername(r.username)));
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // ── Aggregate research insights ──
  const agg = useMemo(() => {
    const n = rows.length;
    const schools = new Set(rows.map(r => r.school).filter(Boolean)).size;
    const activeToday = rows.filter(r => r.last_active === today).length;
    const withAttempts = rows.filter(r => r.questions_seen > 0);
    const avgAccuracy = withAttempts.length
      ? withAttempts.reduce((s, r) => s + r.accuracy, 0) / withAttempts.length : 0;
    const avgStreak = n ? rows.reduce((s, r) => s + r.streak, 0) / n : 0;
    const avgLP = n ? rows.reduce((s, r) => s + r.league_points, 0) / n : 0;
    const totalAnswered = rows.reduce((s, r) => s + r.questions_seen, 0);

    // merged mastery distribution
    const masteryDist = [0, 0, 0, 0, 0];
    // merged topic accuracy
    const topicMap: Record<string, { seen: number; correct: number }> = {};
    for (const r of rows) {
      const d = r.details;
      if (!d) continue;
      (d.masteryDistribution ?? []).forEach((c, i) => { if (i < 5) masteryDist[i] += c; });
      for (const t of d.topicAccuracy ?? []) {
        const e = (topicMap[t.topic] ??= { seen: 0, correct: 0 });
        e.seen += t.seen; e.correct += t.correct;
      }
    }
    const topics = Object.entries(topicMap)
      .map(([topic, v]) => ({ topic, seen: v.seen, correct: v.correct, acc: v.seen ? v.correct / v.seen : 0 }))
      .filter(t => t.seen >= 1)
      .sort((a, b) => a.acc - b.acc); // weakest first (research signal)

    return {
      n, schools, activeToday, avgAccuracy, avgStreak, avgLP, totalAnswered,
      avgMasteryPct, avgActiveDays,
      masteryDist, topics,
    };
  }, [rows, today]);

  // ── Cohort filter: by school or by age bucket ──
  const schoolList = useMemo(
    () => Array.from(new Set(rows.map(r => r.school).filter(Boolean))).sort() as string[],
    [rows],
  );
  const ageBucket = (age: number | null) => {
    if (age == null) return null;
    if (age <= 14) return '13-14y';
    if (age <= 16) return '15-16y';
    if (age <= 18) return '17-18y';
    return '19+y';
  };
  const cohortRows = useMemo(() => {
    if (cohortKey === 'all') return rows;
    if (cohortKey.endsWith('y')) {
      return rows.filter(r => ageBucket(r.age ?? null) === cohortKey);
    }
    return rows.filter(r => r.school === cohortKey);
  }, [rows, cohortKey]);
  const cohortAgg = useMemo(() => {
    const n = cohortRows.length;
    if (!n) return { n: 0, avgAccuracy: 0, avgLP: 0, avgMasteryPct: 0, avgActiveDays: 0 };
    const withAttempts = cohortRows.filter(r => r.questions_seen > 0);
    const avgAccuracy = withAttempts.length
      ? withAttempts.reduce((s, r) => s + r.accuracy, 0) / withAttempts.length : 0;
    const avgLP = cohortRows.reduce((s, r) => s + r.league_points, 0) / n;
    const avgMasteryPct = cohortRows.reduce(
      (s, r) => s + (r.questions_seen ? r.mastered_count / r.questions_seen : 0), 0,
    ) / n;
    const avgActiveDays = cohortRows.reduce((s, r) => s + (r.details?.daysActive ?? 0), 0) / n;
    return { n, avgAccuracy, avgLP, avgMasteryPct, avgActiveDays };
  }, [cohortRows]);

  // ── Pre/post per-topic literacy gain (merge across all students) ──
  const prePost = useMemo(() => {
    const m = new Map<string, { early: { seen: number; correct: number }; recent: { seen: number; correct: number } }>();
    for (const r of rows) {
      const early = r.details?.perTopicEarly ?? {};
      const recent = r.details?.perTopicRecent ?? {};
      const topics = new Set([...Object.keys(early), ...Object.keys(recent)]);
      for (const t of topics) {
        const e = m.get(t) ?? { early: { seen: 0, correct: 0 }, recent: { seen: 0, correct: 0 } };
        if (early[t]) { e.early.seen += early[t].seen; e.early.correct += early[t].correct; }
        if (recent[t]) { e.recent.seen += recent[t].seen; e.recent.correct += recent[t].correct; }
        m.set(t, e);
      }
    }
    const all = Array.from(m.entries())
      .map(([topic, v]) => {
        const totalSeen = v.early.seen + v.recent.seen;
        const earlyAcc = v.early.seen ? v.early.correct / v.early.seen : 0;
        const recentAcc = v.recent.seen ? v.recent.correct / v.recent.seen : 0;
        return {
          topic,
          early: v.early, recent: v.recent,
          earlyAcc, recentAcc,
          lift: recentAcc - earlyAcc,
          totalSeen,
        };
      })
      .filter(t => t.totalSeen >= 3)
      .sort((a, b) => b.lift - a.lift);
    return all;
  }, [rows]);

  // ── Engagement-vs-learning lists ──
  const engagementLists = useMemo(() => {
    const candidates = rows
      .map(r => ({
        username: r.username,
        name: r.username_display,
        avatar: r.avatar,
        engagement: r.questions_seen,
        accuracy: r.accuracy,
        daysActive: r.details?.daysActive ?? 0,
      }))
      .filter(r => r.engagement >= 1);
    const struggling = [...candidates]
      .filter(r => r.engagement >= 3)
      .sort((a, b) => b.engagement - a.engagement || a.accuracy - b.accuracy)
      .slice(0, 5);
    const skipped = [...candidates]
      .filter(r => r.engagement <= 5)
      .sort((a, b) => b.accuracy - a.accuracy || a.engagement - b.engagement)
      .slice(0, 5);
    return { candidates, struggling, skipped };
  }, [rows]);

  const exportCsv = () => {
    const cols = [
      "username", "full_name", "school", "age", "email", "joined_at", "level", "xp",
      "league_points", "league_tier", "streak", "questions_seen",
      "questions_correct", "accuracy", "mastered_count", "daily_done_today",
      "transactions_count", "ribbons_count", "last_active",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [cols.join(",")];
    for (const r of rows) {
      lines.push(cols.map(c => esc((r as Record<string, unknown>)[c])).join(","));
    }
    const csv = lines.join("\n");
    navigator.clipboard?.writeText(csv).then(
      () => alert(`Copied ${rows.length} rows of student data (CSV) to clipboard.`),
      () => alert("Could not access clipboard."),
    );
  };

  const exportTopicCsv = () => {
    const cols = ["username", "school", "age", "joined_at", "topic", "seen", "correct", "accuracy", "mastery_level_avg", "recent_accuracy"];
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const masteryAvg = (dist) => {
      if (!dist || !dist.length) return "";
      const total = dist.reduce((s, c) => s + c, 0);
      if (!total) return "";
      const sum = dist.reduce((s, c, i) => s + c * i, 0);
      return (sum / total).toFixed(2);
    };
    const lines = [cols.join(",")];
    for (const r of rows) {
      const d = r.details;
      if (!d) continue;
      for (const t of d.topicAccuracy ?? []) {
        const recent = d.perTopicRecent && d.perTopicRecent[t.topic];
        const recentAcc = recent && recent.seen ? recent.correct / recent.seen : 0;
        const row = {
          username: r.username,
          school: r.school,
          age: r.age,
          joined_at: r.joined_at,
          topic: t.topic,
          seen: t.seen,
          correct: t.correct,
          accuracy: t.seen ? (t.correct / t.seen).toFixed(4) : "0",
          mastery_level_avg: masteryAvg(d.masteryDistribution),
          recent_accuracy: recentAcc.toFixed(4),
        };
        lines.push(cols.map(c => esc(row[c])).join(","));
      }
    }
    const csv = lines.join("\n");
    const rowCount = lines.length - 1;
    navigator.clipboard?.writeText(csv).then(
      () => alert(`Copied ${rowCount} topic-level rows (one per student x topic) to clipboard.`),
      () => alert("Could not access clipboard."),
    );
  };

  return (
    <motion.div
      key="admin"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-1 rounded-full text-[var(--text-muted)] hover:text-violet-500 active:scale-90 transition-all">
              <ChevronLeft size={22} />
            </button>
          )}
          <div>
            <h1 className="font-black text-xl flex items-center gap-1.5">🛡️ Research</h1>
            <p className="text-xs text-[var(--text-muted)]">How students are studying finance</p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-violet-500 active:scale-90 transition-all"
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {!SUPABASE_ENABLED && (
        <Notice icon={<WifiOff size={16} />} tone="amber"
          text="Supabase isn't configured in this build, so cross-device student data can't be loaded. Set VITE_SUPABASE_* and redeploy." />
      )}

      {SUPABASE_ENABLED && !loading && rows.length === 0 && (
        <Notice icon={<AlertTriangle size={16} />} tone="slate"
          text="No student progress yet. Data appears once students use the app (and after the student_progress table from admin.sql exists)." />
      )}

      {/* Aggregate insight cards */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat icon={<Users size={15} />} label="Students" value={String(agg.n)} sub={`${agg.schools} school${agg.schools === 1 ? "" : "s"}`} />
            <Stat icon={<Target size={15} />} label="Avg accuracy" value={pct(agg.avgAccuracy)} sub={`${agg.totalAnswered} attempts`} />
            <Stat icon={<Flame size={15} />} label="Avg streak" value={agg.avgStreak.toFixed(1)} sub={`${agg.activeToday} active today`} />
            <Stat icon={<GraduationCap size={15} />} label="Avg LP" value={Math.round(agg.avgLP).toLocaleString()} sub="league points" />
          </div>

          {/* Mastery distribution */}
          <Card title="Mastery distribution" subtitle="Across all attempted questions">
            <div className="flex flex-col gap-1.5">
              {agg.masteryDist.map((count, lvl) => {
                const max = Math.max(1, ...agg.masteryDist);
                return (
                  <div key={lvl} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold w-16 shrink-0" style={{ color: MASTERY_COLORS[lvl] }}>{MASTERY_NAMES[lvl]}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-main)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: MASTERY_COLORS[lvl] }} />
                    </div>
                    <span className="text-[11px] font-bold tabular-nums w-7 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Weakest topics */}
          {agg.topics.length > 0 && (
            <Card title="Topics by accuracy" subtitle="Weakest first — where students struggle">
              <div className="flex flex-col gap-1.5">
                {agg.topics.slice(0, 8).map(t => (
                  <div key={t.topic} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold flex-1 truncate">{t.topic}</span>
                    <div className="w-20 h-2 rounded-full bg-[var(--bg-main)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: pct(t.acc), background: t.acc < 0.5 ? "#EF4444" : t.acc < 0.75 ? "#F59E0B" : "#22C55E" }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums w-16 text-right text-[var(--text-muted)]">{pct(t.acc)} ({t.correct}/{t.seen})</span>
                  </div>
                ))}
              </div>
            </Card>
          )}


          {/* Cohort comparison */}
          <Card title="Cohort comparison" subtitle="Filter students by school or age group">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <CohortChip active={cohortKey === 'all'} onClick={() => setCohortKey('all')}>All ({rows.length})</CohortChip>
              {schoolList.map(s => (
                <CohortChip key={s} active={cohortKey === s} onClick={() => setCohortKey(s)}>{s}</CohortChip>
              ))}
              {(["15-16y", "17-18y"] as const).map(b => (
                <CohortChip key={b} active={cohortKey === b} onClick={() => setCohortKey(b)}>{b}</CohortChip>
              ))}
            </div>
            {cohortAgg.n === 0 ? (
              <Notice icon={<AlertTriangle size={14} />} tone="slate" text="No students in this cohort." />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Mini label="n" value={String(cohortAgg.n)} sub="students" />
                <Mini
                  label="Avg accuracy"
                  value={pct(cohortAgg.avgAccuracy)}
                  sub={`${cohortAgg.n > 1 && agg.n > cohortAgg.n ? fmtDelta(cohortAgg.avgAccuracy - agg.avgAccuracy) : "—"} vs all`}
                />
                <Mini
                  label="Avg LP"
                  value={Math.round(cohortAgg.avgLP).toLocaleString()}
                  sub={`${cohortAgg.n > 1 && agg.n > cohortAgg.n ? fmtDeltaPts(cohortAgg.avgLP - agg.avgLP) : "—"} vs all`}
                />
                <Mini
                  label="Mastery %"
                  value={pct(cohortAgg.avgMasteryPct)}
                  sub={`${cohortAgg.n > 1 && agg.n > cohortAgg.n ? fmtDelta(cohortAgg.avgMasteryPct - agg.avgMasteryPct) : "—"} vs all`}
                />
                <Mini
                  label="Active days"
                  value={cohortAgg.avgActiveDays.toFixed(1)}
                  sub={`${cohortAgg.n > 1 && agg.n > cohortAgg.n ? fmtDelta(cohortAgg.avgActiveDays - agg.avgActiveDays) : "—"} vs all`}
                />
              </div>
            )}
          </Card>

          {/* Pre/post literacy gain */}
          {prePost.length > 0 && (
            <Card title="Pre/post literacy gain" subtitle="Earlier half vs recent half of attempts per topic">
              <div className="flex flex-col gap-1.5">
                {prePost.slice(0, 8).map(t => (
                  <div key={t.topic} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold w-24 shrink-0 truncate">{t.topic}</span>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="h-1.5 rounded-full bg-[var(--bg-main)] overflow-hidden flex">
                        <div className="h-full bg-slate-500" style={{ width: `${t.earlyAcc * 100}%` }} />
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-main)] overflow-hidden flex">
                        <div className="h-full bg-violet-500" style={{ width: `${t.recentAcc * 100}%` }} />
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold tabular-nums w-12 text-right shrink-0"
                      style={{ color: t.lift >= 0 ? "#22C55E" : "#EF4444" }}
                    >
                      {t.lift >= 0 ? "+" : ""}{Math.round(t.lift * 100)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">gray = early, violet = recent. Sorted by biggest gain first.</p>
            </Card>
          )}

          {/* Engagement vs learning */}
          <Card title="Engagement vs learning" subtitle="Where students are vs where they should be">
            {engagementLists.candidates.length < 2 ? (
              <Notice icon={<AlertTriangle size={14} />} tone="slate" text="Not enough engagement data yet." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                    <TrendingDown size={11} className="text-red-500" /> High effort, low accuracy
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {engagementLists.struggling.length === 0 ? (
                      <p className="text-[10px] text-[var(--text-muted)]">None in this cohort.</p>
                    ) : engagementLists.struggling.map(s => (
                      <div key={s.username} className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">{s.avatar}</span>
                        <span className="text-[11px] font-semibold truncate flex-1">{s.name}</span>
                        <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: s.accuracy < 0.5 ? "#EF4444" : s.accuracy < 0.75 ? "#F59E0B" : "#22C55E" }}>{pct(s.accuracy)}</span>
                        <span className="text-[9px] text-[var(--text-muted)] tabular-nums shrink-0">·{s.engagement}q</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                    <Sparkles size={11} className="text-violet-500" /> Skipped despite mastery
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {engagementLists.skipped.length === 0 ? (
                      <p className="text-[10px] text-[var(--text-muted)]">None in this cohort.</p>
                    ) : engagementLists.skipped.map(s => (
                      <div key={s.username} className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">{s.avatar}</span>
                        <span className="text-[11px] font-semibold truncate flex-1">{s.name}</span>
                        <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: s.accuracy < 0.5 ? "#EF4444" : s.accuracy < 0.75 ? "#F59E0B" : "#22C55E" }}>{pct(s.accuracy)}</span>
                        <span className="text-[9px] text-[var(--text-muted)] tabular-nums shrink-0">·{s.engagement}q</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Per-student list */}
          <div className="flex items-center justify-between mt-1">
            <h2 className="font-black text-sm uppercase tracking-widest text-[var(--text-muted)]">Students ({agg.n})</h2>
            <button onClick={exportCsv} className="flex items-center gap-1 text-xs font-bold text-violet-500 active:scale-95 transition-transform">
              <Download size={13} /> CSV
            </button>
            <button onClick={exportTopicCsv} className="flex items-center gap-1 text-xs font-bold text-violet-500 active:scale-95 transition-transform">
              <Download size={13} /> Topic CSV
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {rows.map(r => {
              const tier = (TIER_CONFIG as Record<string, { color: string; icon: string }>)[r.league_tier] ?? { color: "#94A3B8", icon: "•" };
              const open = expanded === r.username;
              return (
                <div key={r.username} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                  <button onClick={() => setExpanded(open ? null : r.username)} className="w-full flex items-center gap-3 p-3 text-left active:bg-[var(--bg-main)] transition-colors">
                    <span className="text-2xl shrink-0">{r.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{r.username_display}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {[r.full_name, r.school, r.age ? `${r.age}y` : null].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black" style={{ color: tier.color }}>{tier.icon} {r.league_points.toLocaleString()}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{pct(r.accuracy)} acc · 🔥{r.streak}</p>
                    </div>
                    <ChevronDown size={16} className={`text-[var(--text-muted)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>

                  {open && (
                    <div className="px-3 pb-3 pt-1 flex flex-col gap-3 border-t border-[var(--border-color)]">
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Mini label="Level" value={`L${r.level}`} sub={`${r.xp} XP`} />
                        <Mini label="Seen" value={String(r.questions_seen)} sub={`${r.questions_correct} correct`} />
                        <Mini label="Mastered" value={String(r.mastered_count)} sub="level 4" />
                        <Mini label="Daily today" value={`${r.daily_done_today}/4`} sub="challenges" />
                        <Mini label="Logs" value={String(r.transactions_count)} sub="wallet" />
                        <Mini label="Ribbons" value={String(r.ribbons_count)} sub="earned" />
                      </div>

                      {r.details && (
                        <>
                          {r.details.topicAccuracy.length > 0 && (
                            <Sub title="Topic accuracy">
                              <div className="flex flex-col gap-1">
                                {r.details.topicAccuracy.map(t => (
                                  <div key={t.topic} className="flex items-center justify-between text-[11px]">
                                    <span className="truncate flex-1 text-[var(--text-muted)]">{t.topic}</span>
                                    <span className="font-bold tabular-nums ml-2">{t.seen ? pct(t.correct / t.seen) : "—"} <span className="text-[var(--text-muted)] font-normal">({t.correct}/{t.seen})</span></span>
                                  </div>
                                ))}
                              </div>
                            </Sub>
                          )}

                          <Sub title="Engagement & habits">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                              <KV k="Practice LP today" v={String(r.details.practicePointsToday)} />
                              <KV k="Budget streak" v={`${r.details.budgetStreakDays}d`} />
                              <KV k="Weekly quests" v={`${r.details.weeklyQuestsDone}/${r.details.weeklyQuestsTotal}`} />
                              <KV k="Last active" v={r.last_active ? new Date(r.last_active).toLocaleDateString("en-SG", { day: "numeric", month: "short" }) : "—"} />
                              <KV k="Wallet in / out" v={`$${Math.round(r.details?.walletIncome ?? 0)} / $${Math.round(r.details?.walletExpense ?? 0)}`} />
                              <KV k="Joined" v={r.joined_at ? new Date(r.joined_at).toLocaleDateString("en-SG", { month: "short", year: "numeric" }) : "—"} />
                            </div>
                            {r.email && <p className="text-[10px] text-[var(--text-muted)] mt-1">✉️ {r.email}</p>}
                          </Sub>


                          {/* Life simulator */}
                          <Sub title="Life simulator">
                            {((r.details.lifeRibbonsList?.length ?? 0) > 0 || (r.details.lifeRunState && Object.values(r.details.lifeRunState).some(v => v))) ? (
                              <>
                                {r.details.lifeRibbonsList && r.details.lifeRibbonsList.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {r.details.lifeRibbonsList.map(rid => {
                                      const def = RIBBONS.find(x => x.id === rid);
                                      return (
                                        <span key={rid} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-500" title={def?.description ?? rid}>
                                          {def?.emoji ?? "🎀"} {def?.name ?? rid}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                {r.details.lifeRunState && (
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                    <KV k="Invested before 25" v={r.details.lifeRunState.investedBefore25 ? "Yes" : "No"} />
                                    <KV k="Ever in debt" v={r.details.lifeRunState.everInDebt ? "Yes" : "No"} />
                                    <KV k="Has insurance" v={r.details.lifeRunState.hasInsurance ? "Yes" : "No"} />
                                    <KV k="CPF maxed" v={r.details.lifeRunState.cpfMaxed ? "Yes" : "No"} />
                                    <KV k="Asset classes" v={String(r.details.lifeRunState.assetClassesUsed?.length ?? 0)} />
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-[10px] text-[var(--text-muted)]">Life sim not yet played.</p>
                            )}
                          </Sub>

                          {/* Stock simulator */}
                          <Sub title="Stock simulator">
                            <div className="grid grid-cols-3 gap-1.5">
                              <Mini label="Portfolio" value={`${Math.round(r.details.stockPortfolioValue ?? 0)}`} sub="value" />
                              <Mini
                                label="Net P&L"
                                value={`${(r.details.stockNetPnL ?? 0) >= 0 ? "+" : "-"}${Math.round(Math.abs(r.details.stockNetPnL ?? 0))}`}
                                sub={(r.details.stockNetPnL ?? 0) >= 0 ? "profit" : "loss"}
                              />
                              <Mini label="Cash" value={`${Math.round(r.details.stockCash ?? 0)}`} sub="on hand" />
                            </div>
                          </Sub>

                          {/* Scam Spotter + Bao Tycoon */}
                          {((r.details.scamSpotterRounds ?? 0) > 0 || (r.details.baoTycoonRounds ?? 0) > 0) && (
                            <Sub title="Scam Spotter & Bao Tycoon">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Scam Spotter</p>
                                  {(r.details.scamSpotterRounds ?? 0) > 0 ? (
                                    <div className="flex flex-col gap-0.5 text-[11px]">
                                      <KV k="Lifetime" v={`${r.details.scamSpotterScore ?? 0}/${r.details.scamSpotterPlayed ?? 0}`} />
                                      <KV k="Rounds" v={String(r.details.scamSpotterRounds ?? 0)} />
                                      <KV k="Avg accuracy" v={pct((r.details.scamSpotterPlayed ?? 0) > 0 ? (r.details.scamSpotterScore ?? 0) / r.details.scamSpotterPlayed : 0)} />
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-[var(--text-muted)]">Not played.</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Bao Tycoon</p>
                                  {(r.details.baoTycoonRounds ?? 0) > 0 ? (
                                    <div className="flex flex-col gap-0.5 text-[11px]">
                                      <KV k="Lifetime profit" v={`${(r.details.baoTycoonProfit ?? 0) >= 0 ? "+" : "-"}${Math.round(r.details.baoTycoonProfit ?? 0)}`} />
                                      <KV k="Days played" v={String(r.details.baoTycoonDays ?? 0)} />
                                      <KV k="Rounds" v={String(r.details.baoTycoonRounds ?? 0)} />
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-[var(--text-muted)]">Not played.</p>
                                  )}
                                </div>
                              </div>
                            </Sub>
                          )}

                          {/* Wallet + engagement */}
                          <Sub title="Wallet & engagement">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                              <KV k="Monthly budget" v={(r.details.monthlyBudget ?? 0) > 0 ? `${r.details.monthlyBudget}` : "—"} />
                              <KV k="Weekly budget" v={(r.details.weeklyBudget ?? 0) > 0 ? `${r.details.weeklyBudget}` : "—"} />
                              <KV
                                k="Overspend"
                                v={(r.details.monthlyBudget ?? 0) > 0
                                  ? pct(r.details.walletExpense / r.details.monthlyBudget)
                                  : "—"}
                              />
                              <KV k="Days active" v={String(r.details.daysActive ?? 0)} />
                              <KV k="First active" v={r.details.firstActiveDate ?? "—"} />
                              <KV k="Coins" v={String(r.details.coins ?? 0)} />
                            </div>
                          </Sub>

                          {r.details.topCategories.length > 0 && (
                            <Sub title="Top spending categories">
                              <div className="flex flex-wrap gap-1.5">
                                {r.details.topCategories.map(c => (
                                  <span key={c.categoryId} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                                    {c.categoryId}: ${Math.round(c.total)} ({c.count})
                                  </span>
                                ))}
                              </div>
                            </Sub>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── small sub-components ─────────────────────────────────────────────────
function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3">
      <div className="flex items-center gap-1.5 text-violet-500 mb-1">{icon}<span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{label}</span></div>
      <p className="font-black text-xl leading-none">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
      <p className="font-black text-sm">{title}</p>
      {subtitle && <p className="text-[10px] text-[var(--text-muted)] mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] p-2 text-center">
      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{label}</p>
      <p className="font-black text-sm leading-tight mt-0.5">{value}</p>
      <p className="text-[9px] text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">{title}</p>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-2"><span className="text-[var(--text-muted)] truncate">{k}</span><span className="font-bold shrink-0">{v}</span></div>;
}

function CohortChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
        active
          ? "bg-violet-500/15 border-violet-500/40 text-violet-500"
          : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function Notice({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: "amber" | "slate" }) {
  const cls = tone === "amber"
    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
    : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]";
  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${cls}`}>
      <span className="mt-0.5 shrink-0">{icon}</span><span>{text}</span>
    </div>
  );
}
