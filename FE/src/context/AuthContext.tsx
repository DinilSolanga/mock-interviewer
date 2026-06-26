import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// 1. The shape of what we'll share
type AuthContextType = {
    session: Session | null
    loading: boolean
    register: (email: string, password: string) => Promise<void>
    login: (email: string, password: string) => Promise<void> // Returns a promise because login and logout are async
    logout: () => Promise<void> // void means theres no return value, but you must wait for the effect of the function
}

// 2. Create the context (the "channel")
const AuthContext = createContext<AuthContextType | null>(null)

// 3. The provider component — holds the state, wraps the app
export function AuthProvider({children}: {children: ReactNode}) {
    // The 2 states below dont read from local storage(we use supabase to do this later)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true) // Displays while waiting for supabase to say whether the user is logged in or not

    useEffect(() => {
        // 1. On load, ask Supabase to check for an existing session (from localStorage)
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            setLoading(false)
        })

        // 2. Subscrip tion: listens for and fires on login, logout, AND automatic token refresh(supabase behaviour)
        //
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        // 3. Cleanup: stop subscription if this component ever unmounts
        return () => listener.subscription.unsubscribe()
    }, [] ) // [] means run once upon each load

    async function register(email: string, password: string) {
        const {error} = await supabase.auth.signUp({email, password})
        if (error) throw error
    }

    async function login(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password}) // the actual sign in
        if (!error) throw error // LoginPage catches and handles the error
    }

    async function logout() {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{session, loading, register, login, logout}}>
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