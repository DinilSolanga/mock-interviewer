import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../App.css"


function LoginPage(){
    // React hooks
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const {login, session} = useAuth() // Connects to the context

    if (session) return <Navigate to="/" replace /> // If we're logged in, leave the login page.

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                try {
                    setLoading(true)
                    await login(email, password)
                    setError("") // Clear any old error on success
                } catch (err) {
                    setError('oops login failed: ')
                } finally {
                    setLoading(false)
                }
            }}
        >

            <h1>Log in</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}


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

            <button type="submit" disabled={loading}>{loading ? "logging in" : "Log in"}</button>
        </form>
    )
}
export default LoginPage