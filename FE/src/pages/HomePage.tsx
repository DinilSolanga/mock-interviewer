import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function HomePage() {
  const {session, logout} = useAuth()
  const [result, setResult] = useState("")

  async function callBackend(){
    const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    })
    const data = await res.json()
    setResult(JSON.stringify(data))
  }

  return (
    <>
      <section id="center">
        
        <button onClick={callBackend}>Call backend /me</button>
        {result && <p>{result}</p>}
        {session
          ? <button onClick={logout}>Log out</button>
          : <p>You are not logged in</p>
        }
      </section>

    </>
  )
}

export default HomePage
