import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function LoginPage() {
    // --- state & logic ---
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { login, session } = useAuth() // Connects to the auth context

    if (session) return <Navigate to="/" replace /> // Already logged in -> leave

    return (
        // Full-height row split into two halves side by side
        <div className="flex min-h-screen">

            {/* LEFT — info panel (hidden on small screens) */}
            <div className="hidden md:flex md:w-1/2 flex-col justify-center gap-6 bg-surface px-16">
                <h1 className="text-4xl font-bold leading-tight">
                    Welcome <span className="text-accent">back</span>.
                </h1>
                <p className="text-muted text-lg leading-relaxed">
                    Pick up where you left off. Start a new mock interview or
                    review the feedback from your past sessions.
                </p>
                <ul className="flex flex-col gap-3 text-muted">
                    <li className="flex items-center gap-3">
                        <span className="text-accent">✓</span> Full sessions or single questions
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-accent">✓</span> Instant STAR feedback, scored per metric
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-accent">✓</span> Every session saved to review later
                    </li>
                </ul>
            </div>

            {/* RIGHT — login form */}
            <div className="flex w-full md:w-1/2 items-center justify-center px-8">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()
                        try {
                            setLoading(true)
                            await login(email, password)
                            setError("") // Clear any old error on success
                        } catch (err) {
                            // Surface the real reason instead of a generic string
                            setError(err instanceof Error ? err.message : 'Login failed')
                        } finally {
                            setLoading(false)
                        }
                    }}
                    className="w-full max-w-sm flex flex-col gap-5"
                >
                    <div>
                        <h2 className="text-2xl font-semibold">Log in</h2>
                        <p className="text-muted text-sm mt-1">Welcome back, let's practise.</p>
                    </div>

                    {error && (
                        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                            {error}
                        </p>
                    )}

                    {/* Email field */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-sm text-muted">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-ink transition-colors focus:border-accent focus:outline-none"
                        />
                    </div>

                    {/* Password field */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-sm text-muted">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-ink transition-colors focus:border-accent focus:outline-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-accent py-2.5 font-medium text-canvas transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Logging in…" : "Log in"}
                    </button>

                    <p className="text-center text-sm text-muted">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-accent hover:underline">Create one</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default LoginPage
