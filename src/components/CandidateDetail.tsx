import { motion } from "framer-motion";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CheckCircle2, XCircle, Briefcase, GraduationCap, ThumbsUp, AlertTriangle } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import type { Candidate } from "@/store/appStore";

interface Props {
  candidate: Candidate;
}

const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export function CandidateDetail({ candidate: c }: Props) {
  // Build radar data from skills
  const allSkills = [...new Set([...c.skills_matched, ...c.skills_missing])].slice(0, 8);
  const radarData = allSkills.map((skill) => ({
    skill,
    match: c.skills_matched.includes(skill) ? 100 : 0,
  }));

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ScoreBadge score={c.score} size="lg" />
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-foreground">{c.name}</h2>
          <p className="text-muted-foreground text-sm">{c.email}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {c.experience_years} years</span>
            <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {c.education}</span>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div variants={item} className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">Summary</h3>
        <p className="text-sm text-secondary-foreground leading-relaxed">{c.summary}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Radar */}
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Skill Match</h3>
          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220 14% 18%)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "hsl(215 16% 55%)", fontSize: 10 }} />
                <Radar dataKey="match" stroke="hsl(175 80% 50%)" fill="hsl(175 80% 50%)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Skills Lists */}
        <motion.div variants={item} className="space-y-4">
          <div className="glass-card p-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-success mb-3">
              <CheckCircle2 className="h-4 w-4" /> Matched Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {c.skills_matched.map((s) => (
                <span key={s} className="px-3 py-1 text-xs rounded-full bg-success/10 text-success border border-success/20">{s}</span>
              ))}
            </div>
          </div>
          <div className="glass-card p-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive mb-3">
              <XCircle className="h-4 w-4" /> Missing Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {c.skills_missing.map((s) => (
                <span key={s} className="px-3 py-1 text-xs rounded-full bg-destructive/10 text-destructive border border-destructive/20">{s}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground mb-3">
            <ThumbsUp className="h-5 w-5 text-success" /> Strengths
          </h3>
          <ul className="space-y-2">
            {c.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" /> Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {c.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Recommendation */}
      <motion.div variants={item} className="glass-card p-6 border-l-4 border-primary">
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">AI Recommendation</h3>
        <p className="text-sm text-secondary-foreground leading-relaxed">{c.recommendation}</p>
      </motion.div>
    </motion.div>
  );
}
