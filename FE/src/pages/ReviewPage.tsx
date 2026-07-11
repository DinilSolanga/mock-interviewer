import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

function ReviewPage() {
    const { sessionId} = useParams()  // Extracts the session Id from the URL
    const [answers, setAnswers] = useState<any[]>([])

    useEffect(() => {
        loadAnswers()
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
                        <ul>
                            {// a.feedback.xyz returns a JSONB object since that was how it was stored
                            }
                            <li>Situation ({a.feedback.situation.score}/10): {a.feedback.situation.feedback}</li>
                            <li>Task ({a.feedback.task.score}/10): {a.feedback.task.feedback}</li>
                            <li>Action ({a.feedback.action.score}/10): {a.feedback.action.feedback}</li>
                            <li>Result ({a.feedback.result.score}/10): {a.feedback.result.feedback}</li>
                            <li>Clarity ({a.feedback.clarity.score}/10): {a.feedback.clarity.feedback }</li> 
                        </ul>

                </div>
            ))}
        </>
    )
}
export default ReviewPage