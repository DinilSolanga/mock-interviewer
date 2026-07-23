import { useEffect, useRef, useState} from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams, Link } from 'react-router-dom' // Reads the URL parameters
import { supabase } from '../lib/supabase'

function InterviewPage() {
    const [isRecording, setIsRecording] = useState(false) // UI: which button to show
    const [audioUrl, setAudioUrl] = useState("") // UI: playback source
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [done, setDone] = useState(false)
    const {session} = useAuth()
    const {sessionId} = useParams()

    const mediaRecorderRef = useRef<MediaRecorder | null>(null) // The recorder (not shown)
    const chunksRef = useRef<Blob[]>([]) // The collected audio pieces
    const audioBlobRef = useRef<Blob | null>(null)

    useEffect(() => {
        loadSession()
    }, [])
    
    async function loadSession() {
        // 1. Find what mode the session is: search the DB(authoritative source)
        const { data: sessionRow} = await supabase
            .from('sessions')
            .select('session_type')
            .eq('id', sessionId)
            .single()

        // 2. Get the ordered question set for that mode
        const res = await fetch(`${import.meta.env.VITE_API_URL}/questions/set?mode=${sessionRow.session_type}`)
        setQuestions(await res.json())
    }

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
        const blob = audioBlobRef.current
        if (!blob) return // If the value in the blob is null, do nothing
        const questionText = questions[currentIndex].text
        const questionType = questions[currentIndex].type

        uploadAnswer(blob, questionText, questionType)  // Fire the answer, dont wait for response
        nextQuestion() // Move on immediately      
    }

    async function uploadAnswer(blob : Blob, questionText: string, questionType: string) {
        const formData = new FormData()
        formData.append('file', blob, 'answer.webm') // Stores the audio file
        formData.append('question', questionText) // Stores the question
        formData.append('question_type', questionType)
        formData.append('session_id', sessionId ?? '')

        // The actual sending of the audio to the backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/answers/audio`, {
            method: 'POST',
            headers: {
                Authorization : `Bearer ${session?.access_token}`,
            },
            body: formData,
        })
        if (!res.ok) console.error('upload failed', await res.text())
    }

    function nextQuestion() {
            if (currentIndex + 1 < questions.length){
                setCurrentIndex(currentIndex+1)
                // Reset everything for the fresh question:
                setAudioUrl("")
                audioBlobRef.current = null
            }
            else {
                setDone(true) // Done with the questions
            }
        }

    return (
        <>
        {done ? (
            <div>
                <h2>Session complete! 🎉</h2>
                <Link to={`/session/${sessionId}`}>Review your answers</Link>
            </div>
        ) : (
            <>
                <p>Question {currentIndex + 1} of {questions.length}</p>
                <p>{questions[currentIndex]?.text}</p>

                {isRecording
                ? <button onClick={stopRecording}>Stop</button>
                : <button onClick={startRecording}>Record</button>
                }

                { // built-in browser audio player
                audioUrl && <audio key={audioUrl} src={audioUrl} controls/> 
                }

                { // Submit button
                    audioUrl && <button onClick={submitAnswer}>Submit answer</button>
                }
            </>
        )}    
        </> 
    )
}
export default InterviewPage