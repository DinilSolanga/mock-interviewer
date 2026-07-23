import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

function ReviewPage() {
    const { sessionId} = useParams()  // Extracts the session Id from the URL
    const [answers, setAnswers] = useState<any[]>([]) // All information for a particular answer

    useEffect(() => {
        loadAnswers() // initial load of anything already saved

        const channel = supabase
            .channel(`answers-${sessionId}`) // opens a named realtime channel
            .on( // Sets up the live listener
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'answers',
                    filter: `session_id=eq.${sessionId}`,
                }, // Notifies when a row is inserted into answers where session_id is the current session
                (payload) => {  // Runs everytime matching row is inserted
                    setAnswers((prev) => { // Updates the answers array with the current list + the new row
                        if (prev.some((a) => a.id === payload.new.id)) return prev // Avoids duplicates
                        return [...prev, payload.new] // ...prev represents the previous state of the answers array. We cant use "answers" directly because answers is forever stored as empty inside the callback
                    })
                }
            )
            .subscribe()

        return () => { // Runs after the user leaves the page
            supabase.removeChannel(channel) // Close the connection on unmount (after all the answers have been displayed)
        }
    }, []) // Runs once after the page renders

    async function loadAnswers() {
        const { data, error} = await supabase
            .from('answers')
            .select('*')
            .eq('session_id', sessionId) // filters by entries matching the relevant session
            .order('created_at', {ascending: true})
        if (error) {console.error(error); return}
        setAnswers(data)
    }

    return(
        <>
            <h1>Session Review</h1>
            {answers.length === 0 && <p>No answers in this session yet.</p>}
            {answers.map((a) => (
                <div key={a.id}>
                    <h3>{a.question}</h3>
                        <p><strong>Your answer:</strong> {a.answer_text}</p>
                        <p><strong>Overall:</strong> {a.overall_score}/10</p>
                        {a.question_type === 'intro' ? ( // Display the right breakdown based on question type
                            <ul>
                                <li>Structure ({a.feedback.structure.score}/10): {a.feedback.structure.feedback}</li>
                                <li>Relevance ({a.feedback.relevance.score}/10): {a.feedback.relevance.feedback}</li>
                                <li>Conciseness ({a.feedback.conciseness.score}/10): {a.feedback.conciseness.feedback}</li>
                                <li>Impact ({a.feedback.impact.score}/10): {a.feedback.impact.feedback}</li>
                            </ul>
                            ) : (
                            <ul>
                                {// a.feedback.xyz returns a JSONB object since that was how it was stored
                                }
                                <li>Situation ({a.feedback.situation.score}/10): {a.feedback.situation.feedback}</li>
                                <li>Task ({a.feedback.task.score}/10): {a.feedback.task.feedback}</li>
                                <li>Action ({a.feedback.action.score}/10): {a.feedback.action.feedback}</li>
                                <li>Result ({a.feedback.result.score}/10): {a.feedback.result.feedback}</li>
                                <li>Clarity ({a.feedback.clarity.score}/10): {a.feedback.clarity.feedback }</li> 
                            </ul>
                        )}
                </div>
            ))}
        </>
    )
}
export default ReviewPage