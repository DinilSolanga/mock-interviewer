import { useState } from 'react'
import './App.css'
import { useAuth } from '../context/AuthContext'

function HomePage() {
  const [count, setCount] = useState(0)
  const {token, logout} = useAuth()

  return (
    <>
      <section id="center">
        
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        {token
          ? <button onClick={logout}>Log out</button>
          : <p>You are not logged in</p>
        }
      </section>

    </>
  )
}

export default HomePage
