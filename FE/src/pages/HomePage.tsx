import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

// --- Pure helpers (no React, so they live outside the component) ---

// "1st", "2nd", "3rd", "4th"... the ordinal suffix for a day number
function ordinalSuffix(n: number) {
  if (n >= 11 && n <= 13) return "th"
  switch (n % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

// Format an ISO timestamp as "2nd Sep 2026"
function formatSessionDate(iso: string) {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleString("en-GB", { month: "short" })
  return `${day}${ordinalSuffix(day)} ${month} ${d.getFullYear()}`
}

// Average the answers' scores into a single whole number
function averageScore(answers: { overall_score: number }[]) {
  const sum = answers.reduce((total, a) => total + a.overall_score, 0)
  return Math.round(sum / answers.length)
}

// Capitalise the session mode: "full" -> "Full"
function capitalise(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function HomePage() {
  const { session, logout } = useAuth()
  const [interviewSessions, setInterviewSessions] = useState<any[]>([])
  // Which session is awaiting delete confirmation (undefined = none)
  const [sessionToDelete, setSessionToDelete] = useState<string>()
  const navigate = useNavigate()

  useEffect(() => {
    loadSessions()
  }, [])

  // Fetch sessions AND each one's answer scores in a single query.
  async function loadSessions() {
    const { data, error } = await supabase
      .from('sessions')
      // "answers(overall_score)" pulls each session's related answer rows inline,
      // using the answers.session_id -> sessions.id foreign key.
      .select('*, answers(overall_score)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error); return
    }
    // Only show completed sessions (at least one answer). Abandoned ones have none.
    setInterviewSessions(data.filter((s: any) => s.answers.length > 0))
  }

  // Create a new session of the given mode, then jump into it.
  async function createSession(type: string) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ session_type: type, user_id: session?.user.id })
      .select()
      .single()
    if (error) {
      console.error(error); return
    }
    navigate(`/interview/${data.id}`)
  }

  // Delete a session, then refresh the list so the UI matches the database.
  async function deleteSession(sessionId: string) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
    if (error) {
      console.error(error); return
    }
    setSessionToDelete(undefined) // close the inline confirm
    loadSessions()                // resync the list
  }

  return (
    <div className="flex min-h-screen flex-col">

      {/* TOP BAR */}
      <header className="flex items-center justify-between border-b border-line px-8 py-4">
        <span className="text-lg font-semibold">Interviewer</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            {/* Avatar circle showing the first letter of the email */}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 font-medium uppercase text-accent">
              {session?.user.email?.charAt(0)}
            </span>
            {session?.user.email}
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* BODY: sidebar + main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR: past sessions */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-line p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Past sessions
          </h2>
          {interviewSessions.length === 0 ? (
            <p className="text-sm text-muted">No sessions yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {interviewSessions.map((s) => (
                <li key={s.id}>
                  <div className="rounded-lg border border-line bg-surface transition-colors hover:border-accent">
                    {/* Row: link to review + a reveal-on-hover delete button (siblings, not nested) */}
                    <div className="group relative flex items-center">
                      <Link to={`/session/${s.id}`} className="block flex-1 px-4 py-3">
                        <span className="text-sm font-medium">{capitalise(s.session_type)}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {formatSessionDate(s.created_at)} · {averageScore(s.answers)}/10
                        </span>
                      </Link>
                      <button
                        onClick={() => setSessionToDelete(s.id)}
                        className="mr-2 rounded p-1.5 text-muted opacity-0 transition-all hover:text-red-300 group-hover:opacity-100"
                        aria-label="Delete session"
                      >
                        ×
                      </button>
                    </div>

                    {/* Inline confirmation panel, expands within this card */}
                    {sessionToDelete === s.id && (
                      <div className="border-t border-line px-4 py-3">
                        <p className="mb-2 text-xs text-muted">
                          Delete this session? This can't be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSessionToDelete(undefined)}
                            className="rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:text-ink"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deleteSession(s.id)} 
                            className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* MAIN: welcome + start-session cards */}
        <main className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Ready to practise?</h1>
            <p className="mt-2 text-muted">Choose a session type to get started.</p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row">
            {/* FULL session card */}
            <button
              onClick={() => createSession('full')}
              className="group flex w-64 flex-col gap-3 rounded-2xl border border-line bg-surface p-8 text-left transition-all hover:-translate-y-1 hover:border-accent"
            >
              <span className="text-lg font-semibold">Full session</span>
              <span className="text-sm text-muted">
                An intro question plus several behavioural questions, back to back.
              </span>
              <span className="mt-2 text-sm font-medium text-accent transition-transform group-hover:translate-x-1">
                Start →
              </span>
            </button>

            {/* SINGLE question card */}
            <button
              onClick={() => createSession('single')}
              className="group flex w-64 flex-col gap-3 rounded-2xl border border-line bg-surface p-8 text-left transition-all hover:-translate-y-1 hover:border-accent"
            >
              <span className="text-lg font-semibold">Single question</span>
              <span className="text-sm text-muted">
                One behavioural question and instant feedback. Quick practice.
              </span>
              <span className="mt-2 text-sm font-medium text-accent transition-transform group-hover:translate-x-1">
                Start →
              </span>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default HomePage
