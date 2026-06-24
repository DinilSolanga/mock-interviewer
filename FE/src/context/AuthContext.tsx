import { createContext, useContext, useState, type ReactNode } from "react";

// 1. The shape of what we'll share
type AuthContextType = {
    token: string | null
    login: (token: string) => void
    logout: () => void
}

// 2. Create the context (the "channel")
const AuthContext = createContext<AuthContextType | null>(null)

// 3. The provider component — holds the state, wraps the app
export function AuthProvider({children}: {children: ReactNode}) {
    // start from localStorage so a refresh keeps you logged in
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("token")
    )

    function login(newToken: string) {
        localStorage.setItem("token", newToken) // persist
        setToken(newToken) // update state -> re-render
    }

    function logout() {
        localStorage.removeItem("token")
        setToken(null)
    }

    return (
        <AuthContext.Provider value={{token, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

// 4. A convenience hook so components can read the context
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
    return ctx
}