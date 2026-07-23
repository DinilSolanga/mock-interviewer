import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

function HomePage() {
  const {session, logout} = useAuth() // The auth session- login state
  const [interviewSessions, setInterviewSessions] = useState<any[]>([]) // syntax is for type hinting that the value is an array: <> after useState is used for defining type. any means it can be anything, [] means its an array
  const [result, setResult] = useState("")
  const navigate = useNavigate()

  // Function that loads the sessions once AFTER the component renders. Needs to be wrapped in useEffect because otherwise, it would re-render the page when it runs, which would call the function again, creating an infinite loop
  useEffect(() => {
    loadSessions()
  }, [])

  // Fetch the sessions from supabase
  async function loadSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', {ascending: false})
    if (error) {
      console.error(error); return
    }
    setInterviewSessions(data) // Replace the past list with the rows Supabase returned and re-render
  }

  // Create a new session
  async function createSession(type: string) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({session_type: type, user_id: session?.user.id})
      .select() // Return the created row/rows
      .single() // Since we only made one row, return one object(so we can do data.id instead of data[0].id)
    if (error){
      console.error(error); return
    }
    navigate(`/interview/${data.id}`) // Navigate to that sessions interview page
  }

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
        
        <button onClick={() => createSession('full')}>Start Full Session</button>
        <button onClick={() => createSession('single')}>Single Question</button>
        <ul>
          
          {interviewSessions.map((s) =>( // Turns every session object into a <li> (list)
            <li key={s.id}>
              <Link to={`/session/${s.id}`}>
                {s.session_type} - {new Date(s.created_at).toLocaleString()}
              </Link>
            </li> // s.id is the row id. tolocalestring converts the date into a readable format
          )) // {} lets u write javascript in the html blocks
          }
        </ul>
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
