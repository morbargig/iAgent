import React, { createContext, useContext } from "react";
import { useAppSessionStorage } from "../hooks/storage";

interface AuthContextType {
  authToken: string | null;
  userId: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authToken, setAuthToken] = useAppSessionStorage('session-token');
  const [userId, setUserId] = useAppSessionStorage('user-id');
  const [userEmail, setUserEmail] = useAppSessionStorage('user-email');

  const isAuthenticated = Boolean(authToken && userId && userEmail);

  const login = React.useCallback((token: string, userId: string, email: string) => {
    setAuthToken(token);
    setUserId(userId);
    setUserEmail(email);
  }, [setAuthToken, setUserId, setUserEmail]);

  const logout = React.useCallback(() => {
    setAuthToken('');
    setUserId(null);
    setUserEmail(null);
  }, [setAuthToken, setUserId, setUserEmail]);

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userId,
        userEmail,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

