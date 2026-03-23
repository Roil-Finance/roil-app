import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { setAuthToken, getAuthToken } from '@/hooks/useApi';
import { config } from '@/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthUser {
  party: string;
  displayName: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username?: string;
}

interface AuthResponse {
  token: string;
  party: string;
  displayName: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_TOKEN = 'roil_auth_token';
const STORAGE_KEY_USER = 'roil_auth_user';

function persistAuth(token: string, user: AuthUser) {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

function clearPersistedAuth() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
}

function loadPersistedAuth(): { token: string; user: AuthUser } | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (token && raw) {
      const user = JSON.parse(raw) as AuthUser;
      return { token, user };
    }
  } catch {
    // Corrupted storage — clear it
    clearPersistedAuth();
  }
  return null;
}

/** Check whether a JWT is expired (without verifying signature). */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      // exp is in seconds, Date.now() in ms
      return Date.now() >= payload.exp * 1000;
    }
    return false; // no exp claim — treat as valid
  } catch {
    return true; // malformed token
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const persisted = loadPersistedAuth();
    if (persisted && !isTokenExpired(persisted.token)) {
      setToken(persisted.token);
      setUser(persisted.user);
      setAuthToken(persisted.token);
    } else if (persisted) {
      // Token expired — clean up
      clearPersistedAuth();
      setAuthToken(null);
    }
    setIsLoading(false);
  }, []);

  // ---- login ----
  const login = useCallback(async (email: string, password: string) => {
    const url = `${config.backendUrl}/api/auth/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      // Try to extract a structured error message
      let message = 'Login failed';
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
        else if (body?.message) message = body.message;
      } catch {
        // non-JSON body — use status text
        if (res.status === 401) message = 'Invalid email or password';
        else if (res.status === 404) message = 'Auth service unavailable — please try again later';
        else message = `Server error (${res.status})`;
      }
      throw new Error(message);
    }

    const data: AuthResponse = await res.json();
    // Unwrap envelope if backend wraps it
    const payload = (data as unknown as { success: boolean; data: AuthResponse }).data ?? data;

    const authUser: AuthUser = {
      party: payload.party,
      displayName: payload.displayName,
      email,
    };

    setToken(payload.token);
    setUser(authUser);
    setAuthToken(payload.token);
    persistAuth(payload.token, authUser);
  }, []);

  // ---- signup ----
  const signup = useCallback(async (signupData: SignupData) => {
    const url = `${config.backendUrl}/api/auth/register`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
    });

    if (!res.ok) {
      let message = 'Registration failed';
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
        else if (body?.message) message = body.message;
      } catch {
        if (res.status === 409) message = 'An account with this email already exists';
        else if (res.status === 404) message = 'Auth service unavailable — please try again later';
        else message = `Server error (${res.status})`;
      }
      throw new Error(message);
    }

    const data: AuthResponse = await res.json();
    const payload = (data as unknown as { success: boolean; data: AuthResponse }).data ?? data;

    const authUser: AuthUser = {
      party: payload.party,
      displayName: payload.displayName,
      email: signupData.email,
    };

    setToken(payload.token);
    setUser(authUser);
    setAuthToken(payload.token);
    persistAuth(payload.token, authUser);
  }, []);

  // ---- logout ----
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    clearPersistedAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
