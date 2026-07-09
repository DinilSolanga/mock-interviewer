import { useRef, useState} from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom' // Reads the URL parameters

function InterviewPage() {
    const [isRecording, setIsRecording] = useState(false) // UI: which button to show
    const [audioUrl, setAudioUrl] = useState("") // UI: playback source
    const [transcript, setTranscript] = useState("") // Transcript of the answer
    const [feedback, setFeedback] = useState<any>(null)
    const {session} = useAuth()
    const {sessionId} = useParams()

    const mediaRecorderRef = useRef<MediaRecorder | null>(null) // The recorder (not shown)
    const chunksRef = useRef<Blob[]>([]) // The collected audio pieces
    const audioBlobRef = useRef<Blob | null>(null)
    const question = "Tell me about yourself"

    async function startRecording() {
        // 1. Ask for mic access - triggers the browser permission prompt
        const stream = await navigator.mediaDevices.getUserMedia({audio: true})

        // 2. Make a recorder for that stream
        const recorder = new MediaRecorder(stream)
        chunksRef.current = [] // Reset the audio blob from any previous recording

        // 3. Each time a chunk of audio is ready, stash it
        recorder.ondataavailable = (e) => {
            chunksRef.current.push(e.data)
        }

        // 4. When recording stops, assemble the chunks into one playable file
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, {type: 'audio/webm'}) // Glues all the chunks into one "Blob"
            audioBlobRef.current = blob // Store the blob for uploading
            setAudioUrl(URL.createObjectURL(blob)) // Makes a temporary URL that points at the audio
            stream.getTracks().forEach((track) => track.stop()) // Stop the mic
        }

        recorder.start()
        mediaRecorderRef.current = recorder
        setIsRecording(true)
    }

    function stopRecording() {
        mediaRecorderRef.current?.stop() // Triggers the .onstop() handler above (the ? specifies to do so only if the ref isnt null)
        setIsRecording(false)
    }

    async function submitAnswer() {
        if (!audioBlobRef.current) return // If the value in the blob is null, do nothing

        const formData = new FormData()
        formData.append('file', audioBlobRef.current, 'answer.webm') // Stores the audio file
        formData.append('question', question) // Stores the question
        formData.append('session_id', sessionId ?? '')

        // The actual sending of the audio to the backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/answers/audio`, {
            method: 'POST',
            headers: {
                Authorization : `Bearer ${session?.access_token}`,
            },
            body: formData,
        })
        const data = await res.json() // Waits for the response
        setTranscript(data.transcript) // Writes the transcript to the transcript state
        setFeedback(data.feedback) // Writes the feedback to the feedback state
        console.log('backend received', data)
    }

    return (
        <>
            <h1>Interview</h1>
            <p>{question}</p>

            {isRecording
            ? <button onClick={stopRecording}>Stop</button>
            : <button onClick={startRecording}>Record</button>
            }

            { // Transcript of answer
                transcript && <p><strong>Transcript: </strong> {transcript}</p>
            }
            <ul>
                { // Feedback
                    feedback && (
                        <div>
                            <p><strong>Overall:</strong> {feedback.overall_score}/10</p>
                            <ul>
                                <li>Situation ({feedback.situation.score}/10): {feedback.situation.feedback}</li>
                                <li>Task ({feedback.task.score}/10): {feedback.task.feedback}</li>
                                <li>Action ({feedback.action.score}/10): {feedback.action.feedback}</li>
                                <li>Result ({feedback.result.score}/10): {feedback.result.feedback}</li>
                                <li>Clarity ({feedback.clarity.score}/10): {feedback.clarity.feedback}</li>
                            </ul>
                        </div>
                    )   
                }
            </ul>

            { // built-in browser audio player
            audioUrl && <audio key={audioUrl} src={audioUrl} controls/> 
            }

            { // Submit button
                audioUrl && <button onClick={submitAnswer}>Submit answer</button>
            }
        </>
    )
}

export default InterviewPage