import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../App.css"


function RegisterPage(){
    // React hooks
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const {register, session} = useAuth() // Connects to the context
    const [submitted, setSubmitted] = useState(false)

    if (session) return <Navigate to="/" replace /> // If registered, leave the login page.

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                try {
                    setLoading(true)
                    await register(email, password)
                    setSubmitted(true)
                    setError("") // Clear any old error on success
                    
                } catch (err) {
                    setError(err instanceof Error ? err.message: 'oops registration failed')
                } finally {
                    setLoading(false)
                }
            }}
        >

            <h1>Register</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {submitted && <p>Check your email to confirm your account, then log in.</p>} 


            <label htmlFor="email">Email</label> 
            <input 
                id="email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
             />

            <label htmlFor="password">Password</label>
            <input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
             />

            <button type="submit" disabled={loading}>{loading ? "Registering" : "Register"}</button>
            <p>Have an account? <Link to={'/login'}>Log in</Link></p>
            
        </form>
    )
}
export default RegisterPage