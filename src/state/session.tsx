import { createContext, useContext, type ReactNode } from 'react';
import type { LocalProfile } from '../data/users';

type SessionValue = {
  user: LocalProfile | null;
  setUser: (user: LocalProfile | null) => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

/** Shares the local profile with screens. Passwords are never kept here. */
export function SessionProvider({ value, children }: { value: SessionValue; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('session');
  return value;
}
