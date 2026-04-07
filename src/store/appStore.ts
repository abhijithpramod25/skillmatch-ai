import { create } from 'zustand';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  score: number;
  skills_matched: string[];
  skills_missing: string[];
  experience_years: number;
  education: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  file_name: string;
  created_at: string;
}

export interface ScreeningSession {
  id: string;
  job_title: string;
  job_description: string;
  candidates: Candidate[];
  created_at: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  total_resumes: number;
  processed_resumes: number;
}

interface AppState {
  currentSession: ScreeningSession | null;
  sessions: ScreeningSession[];
  setCurrentSession: (session: ScreeningSession | null) => void;
  addSession: (session: ScreeningSession) => void;
  updateSession: (id: string, updates: Partial<ScreeningSession>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentSession: null,
  sessions: [],
  setCurrentSession: (session) => set({ currentSession: session }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      currentSession:
        state.currentSession?.id === id
          ? { ...state.currentSession, ...updates }
          : state.currentSession,
    })),
}));
