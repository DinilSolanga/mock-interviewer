import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function RegisterPage() {
    // --- state & logic (unchanged from before) ---
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const { register, session } = useAuth() // Connects to the auth context

    if (session) return <Navigate to="/" replace /> // Already logged in -> leave

    return (
        // Full-height row split into two halves side by side
        <div className="flex min-h-screen">

            {/* LEFT — info panel. Hidden on small screens (md:flex shows it at >=768px) */}
            <div className="hidden md:flex md:w-1/2 flex-col justify-center gap-6 bg-surface px-16">
                <h1 className="text-4xl font-bold leading-tight">
                    Ace your next <span className="text-accent">interview</span>.
                </h1>
                <p className="text-muted text-lg leading-relaxed">
                    Practise real interview questions out loud and get instant,
                    AI-powered feedback on how you answered.
                </p>
                <ul className="flex flex-col gap-3 text-muted">
                    <li className="flex items-center gap-3">
                        <span className="text-accent">✓</span> Answer by voice, just like the real thing
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-accent">✓</span> STAR-based scoring and rewrite tips
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-accent">✓</span> Review and revisit every session
                    </li>
                </ul>
            </div>

            {/* RIGHT — sign-up form, vertically + horizontally centered */}
            <div className="flex w-full md:w-1/2 items-center justify-center px-8">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()
                        try {
                            setLoading(true)
                            await register(email, password)
                            setSubmitted(true)
                            setError("") // Clear any old error on success
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'oops registration failed')
                        } finally {
                            setLoading(false)
                        }
                    }}
                    // max-w-sm caps the form width; gap-5 spaces the fields evenly
                    className="w-full max-w-sm flex flex-col gap-5"
                >
                    <div>
                        <h2 className="text-2xl font-semibold">Create your account</h2>
                        <p className="text-muted text-sm mt-1">Start practising in minutes.</p>
                    </div>

                    {/* Error message — soft red pill (bg-red-500/10 = red at 10% opacity) */}
                    {error && (
                        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                            {error}
                        </p>
                    )}
                    {/* Success message — accent-tinted pill */}
                    {submitted && (
                        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">
                            Check your email to confirm your account, then log in.
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

                    {/* Submit — accent button with dark (canvas) text */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-accent py-2.5 font-medium text-canvas transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Creating account…" : "Sign up"}
                    </button>

                    <p className="text-center text-sm text-muted">
                        Have an account?{" "}
                        <Link to="/login" className="text-accent hover:underline">Log in</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default RegisterPage
