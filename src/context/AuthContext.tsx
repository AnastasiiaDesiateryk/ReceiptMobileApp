import React, { createContext, useMemo, useState } from 'react';

type User = { id: string };

type AuthCtx = {
  user: User;
  isAuthenticated: true;
  loading: false;
  error: null;
  login: (email?: string, password?: string) => Promise<void>;
  signup: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx>({} as AuthCtx);

type AuthProviderProps = { children: React.ReactNode };

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user] = useState<User>({ id: 'local' });

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAuthenticated: true,
      loading: false,
      error: null,
      login: async () => {},
      signup: async () => {},
      logout: async () => {},
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
