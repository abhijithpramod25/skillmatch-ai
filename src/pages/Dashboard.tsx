import { motion } from "framer-motion";
import { Users, FileText, TrendingUp, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const { sessions, currentSession } = useAppStore();
  const latestSession = currentSession || sessions[0];
  const candidates = latestSession?.candidates || [];
  const totalResumes = sessions.reduce((a, s) => a + s.total_resumes, 0);
  const avgScore =
    candidates.length > 0
      ? Math.round(candidates.reduce((a, c) => a + c.score, 0) / candidates.length)
      : 0;
  const topCandidates = [...candidates].sort((a, b) => b.score - a.score).slice(0, 5);

  const scoreDistribution = [
    { range: "0-25", count: candidates.filter((c) => c.score <= 25).length, color: "hsl(0 72% 55%)" },
    { range: "26-50", count: candidates.filter((c) => c.score > 25 && c.score <= 50).length, color: "hsl(38 92% 55%)" },
    { range: "51-75", count: candidates.filter((c) => c.score > 50 && c.score <= 75).length, color: "hsl(175 80% 50%)" },
    { range: "76-100", count: candidates.filter((c) => c.score > 75).length, color: "hsl(152 60% 50%)" },
  ];

  const stats = [
    { label: "Total Resumes", value: totalResumes, icon: FileText, gradient: "from-primary/20 to-primary/5" },
    { label: "Screening Sessions", value: sessions.length, icon: Users, gradient: "from-accent/20 to-accent/5" },
    { label: "Avg Match Score", value: `${avgScore}%`, icon: TrendingUp, gradient: "from-success/20 to-success/5" },
    { label: "Top Score", value: topCandidates[0] ? `${topCandidates[0].score}%` : "—", icon: Target, gradient: "from-warning/20 to-warning/5" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="font-display text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your resume screening activity</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`glass-card-hover p-5 bg-gradient-to-br ${s.gradient}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="font-display text-2xl font-bold mt-1 text-foreground">{s.value}</p>
              </div>
              <s.icon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution */}
        <motion.div variants={item} className="glass-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Score Distribution</h2>
          {candidates.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" stroke="hsl(215 16% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 16% 55%)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(220 18% 10%)",
                    border: "1px solid hsl(220 14% 24%)",
                    borderRadius: "8px",
                    color: "hsl(210 40% 96%)",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Target className="h-12 w-12 mb-3 opacity-30" />
              <p>No screening data yet</p>
              <Button variant="glow" size="sm" className="mt-3" asChild>
                <Link to="/upload">Start Screening <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Top Candidates Spotlight */}
        <motion.div variants={item} className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">🌟 Top Candidates</h2>
          {topCandidates.length > 0 ? (
            <div className="space-y-3">
              {topCandidates.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <span className="font-display text-xs text-muted-foreground w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.experience_years}y exp</p>
                  </div>
                  <ScoreBadge score={c.score} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Upload resumes to see top candidates
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
