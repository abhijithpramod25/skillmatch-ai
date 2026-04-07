import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SortAsc, SortDesc, Eye, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CandidateDetail } from "@/components/CandidateDetail";
import type { Candidate } from "@/store/appStore";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

type SortField = "score" | "name" | "experience_years";

export default function ResultsPage() {
  const { currentSession } = useAppStore();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const candidates = currentSession?.candidates || [];

  const filtered = candidates
    .filter(
      (c) =>
        c.score >= minScore &&
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.skills_matched.some((s) => s.toLowerCase().includes(search.toLowerCase())))
    )
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === "score") return (a.score - b.score) * dir;
      if (sortField === "experience_years") return (a.experience_years - b.experience_years) * dir;
      return a.name.localeCompare(b.name) * dir;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (selectedCandidate) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Results
        </Button>
        <CandidateDetail candidate={selectedCandidate} />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-xl font-semibold text-foreground">No results yet</h2>
        <p className="text-muted-foreground mt-1 mb-4">Upload and screen resumes to see results here.</p>
        <Button variant="glow" asChild>
          <Link to="/upload">Upload Resumes</Link>
        </Button>
      </div>
    );
  }

  const SortIcon = sortAsc ? SortAsc : SortDesc;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-display text-3xl font-bold gradient-text">Screening Results</h1>
        <p className="text-muted-foreground mt-1">
          {currentSession?.job_title} · {candidates.length} candidates analyzed
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="glass-card p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Min Score:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-foreground font-medium w-10">{minScore}%</span>
        </div>
        <div className="flex gap-1">
          {(["score", "name", "experience_years"] as SortField[]).map((f) => (
            <Button
              key={f}
              variant={sortField === f ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleSort(f)}
              className="text-xs capitalize"
            >
              {f === "experience_years" ? "Exp" : f}
              {sortField === f && <SortIcon className="h-3 w-3 ml-1" />}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Results Table */}
      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4 text-left">Skills Match</th>
                <th className="p-4 text-center">Experience</th>
                <th className="p-4 text-left">Recommendation</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  <td className="p-4 text-muted-foreground font-display">{i + 1}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.file_name}</p>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <ScoreBadge score={c.score} size="sm" />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {c.skills_matched.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success border border-success/20">
                          {s}
                        </span>
                      ))}
                      {c.skills_matched.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{c.skills_matched.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center text-foreground">{c.experience_years}y</td>
                  <td className="p-4 text-xs text-muted-foreground max-w-[150px] truncate">
                    {c.recommendation}
                  </td>
                  <td className="p-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
