import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

async function fakeLogin(email:string, password:string) {
    // Pretend to call a server
    await new Promise((resolve) => setTimeout(resolve,1000))
    if (email === 'test@test.com' && password === '123') {
        return{token: 'fake-jwt-token-123'}
    }
    throw new Error('Invalid email or password')
}

function LoginPage(){
    // React hooks
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate() // for redirecting upon successful login
    const {login} = useAuth() // Connects to the context

    

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                try {
                    setLoading(true)
                    const result = await fakeLogin(email, password)
                    login(result.token) // Stores it in context + local storage
                    setError("") // Clear any old error on success
                    navigate("/")
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