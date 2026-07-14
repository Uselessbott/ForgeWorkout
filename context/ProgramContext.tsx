import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as db from '@/lib/db';
import { ProgramFile } from '@/types/program';

interface ProgramContextValue {
  programs: db.Program[];
  activeProgram: db.Program | null;
  loading: boolean;
  refresh: () => void;
  importProgram: (file: ProgramFile, startDate?: string) => db.Program;
  setActiveProgram: (id: string) => void;
  deleteProgram: (id: string) => void;
}

const ProgramContext = createContext<ProgramContextValue | null>(null);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<db.Program[]>([]);
  const [activeProgram, setActiveProgramState] = useState<db.Program | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    db.initDatabase();
    setPrograms(db.getPrograms());
    setActiveProgramState(db.getActiveProgram());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const importProgramFn = useCallback(
    (file: ProgramFile, startDate?: string) => {
      const program = db.importProgram(file, startDate);
      refresh();
      return program;
    },
    [refresh],
  );

  const setActiveProgramFn = useCallback(
    (id: string) => {
      db.setActiveProgram(id);
      refresh();
    },
    [refresh],
  );

  const deleteProgramFn = useCallback(
    (id: string) => {
      db.deleteProgram(id);
      refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      programs,
      activeProgram,
      loading,
      refresh,
      importProgram: importProgramFn,
      setActiveProgram: setActiveProgramFn,
      deleteProgram: deleteProgramFn,
    }),
    [programs, activeProgram, loading, refresh, importProgramFn, setActiveProgramFn, deleteProgramFn],
  );

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
}

export function useProgram() {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error('useProgram must be used within ProgramProvider');
  return ctx;
}
