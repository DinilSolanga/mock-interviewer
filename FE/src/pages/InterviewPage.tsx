import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function InterviewPage() {
    const [isRecording, setIsRecording] = useState(false) // UI: which button to show
    const [isPreparing, setIsPreparing] = useState(false) // UI: mic is starting up
    const [audioUrl, setAudioUrl] = useState("") // UI: playback source
    const [questions, setQuestions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [done, setDone] = useState(false)
    const [showExitConfirm, setShowExitConfirm] = useState(false) // exit modal visibility
    const [failedUploads, setFailedUploads] = useState<
        { blob: Blob; question: string; questionType: string }[]>([]) // Track failed uploads
    const [loadError, setLoadError] = useState("") // Track failure to load the interview
    const [micError, setMicError] = useState("") // Track mic-permission problems
    const { session } = useAuth()
    const { sessionId } = useParams()
    const navigate = useNavigate()

    const mediaRecorderRef = useRef<MediaRecorder | null>(null) // The recorder (not shown)
    const chunksRef = useRef<Blob[]>([]) // The collected audio pieces
    const audioBlobRef = useRef<Blob | null>(null)

    useEffect(() => {
        loadSession()
    }, [])

    // Warn before leaving/refreshing while a session is unfinished, so answers
    // aren't lost by an accidental close. Finished sessions (done) are safe to leave.
    useEffect(() => {
        if (done) return
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            e.preventDefault()
            e.returnValue = "" // some browsers require this to show the native prompt
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [done])

    async function loadSession() {
        try {
            // 1. Find what mode the session is: search the DB (authoritative source)
            const { data: sessionRow } = await supabase
                .from('sessions')
                .select('session_type')
                .eq('id', sessionId)
                .single()

            // 2. Get the ordered question set for that mode
            const res = await fetch(`${import.meta.env.VITE_API_URL}/questions/set?mode=${sessionRow.session_type}`)
            if (!res.ok) throw new Error("Couldn't load questions") // Catch HTTP errors
            setQuestions(await res.json())
        } catch (err) { // Catch network errors
            setLoadError("Failed to load the interview. Please refresh.")
        }
    }

    async function startRecording() {
        try {
            setIsPreparing(true)
            setMicError("")
            // 1. Ask for mic access - triggers the browser permission prompt
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // 2. Make a recorder for that stream
            const recorder = new MediaRecorder(stream)
            chunksRef.current = [] // Reset the audio blob from any previous recording

            // 3. Each time a chunk of audio is ready, stash it
            recorder.ondataavailable = (e) => {
                chunksRef.current.push(e.data)
            }

            // 4. When recording stops, assemble the chunks into one playable file
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' }) // Glue chunks into one Blob
                audioBlobRef.current = blob // Store the blob for uploading
                setAudioUrl(URL.createObjectURL(blob)) // Temporary URL pointing at the audio
                stream.getTracks().forEach((track) => track.stop()) // Stop the mic
            }

            recorder.start()
            mediaRecorderRef.current = recorder
            setIsRecording(true)
        } catch (err) {
            console.error('mic error', err)
            setMicError("Couldn't access your microphone. Please allow mic access and try again.")
        } finally {
            setIsPreparing(false)
        }
    }

    function stopRecording() {
        mediaRecorderRef.current?.stop() // Triggers the .onstop() handler above (only if the ref isn't null)
        setIsRecording(false)
    }

    async function submitAnswer() {
        const blob = audioBlobRef.current
        if (!blob) return // If the value in the blob is null, do nothing
        const questionText = questions[currentIndex].text
        const questionType = questions[currentIndex].type

        uploadAnswer(blob, questionText, questionType) // Fire the answer, don't wait for the response
        nextQuestion() // Move on immediately
    }

    async function uploadAnswer(blob: Blob, questionText: string, questionType: string) {
        try {
            const formData = new FormData()
            formData.append('file', blob, 'answer.webm') // Stores the audio file
            formData.append('question', questionText) // Stores the question
            formData.append('question_type', questionType)
            formData.append('session_id', sessionId ?? '')

            const res = await fetch(`${import.meta.env.VITE_API_URL}/answers/audio`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token}` },
                body: formData,
            })
            if (!res.ok) throw new Error(`Server returned ${res.status}`) // Catch HTTP errors
        } catch (err) { // Catch network errors
            console.error('upload failed', err)
            setFailedUploads((prev) => [...prev, { blob, question: questionText, questionType }])
        }
    }

    function retryUpload(failed: { blob: Blob; question: string; questionType: string }) {
        setFailedUploads((prev) => prev.filter((f) => f !== failed)) // remove it from the list
        uploadAnswer(failed.blob, failed.question, failed.questionType) // try again
    }

    function nextQuestion() {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(currentIndex + 1)
            // Reset per-question UI for the fresh question:
            setAudioUrl("")
            audioBlobRef.current = null
        } else {
            setDone(true) // Done with the questions
        }
    }

    // Abandon the session: delete it (its answers cascade-delete) and go home.
    async function exitSession() {
        await supabase.from('sessions').delete().eq('id', sessionId)
        navigate('/')
    }

    return (
        <div className="flex min-h-screen flex-col">

            {/* HEADER: exit button + progress count */}
            <header className="flex items-center justify-between border-b border-line px-8 py-4">
                {!done ? (
                    <button
                        onClick={() => setShowExitConfirm(true)}
                        className="text-sm text-muted transition-colors hover:text-ink"
                    >
                        Exit
                    </button>
                ) : (
                    <span />
                )}
                {questions.length > 0 && !done && (
                    <span className="text-sm text-muted">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                )}
            </header>

            {/* PROGRESS BAR: fills as answers are submitted */}
            {questions.length > 0 && !done && (
                <div className="h-1 w-full bg-elevated">
                    <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${(currentIndex / questions.length) * 100}%` }}
                    />
                </div>
            )}

            {/* MAIN */}
            <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">

                {loadError ? (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                        {loadError}
                    </p>
                ) : done ? (
                    /* DONE view */
                    <div className="flex flex-col items-center gap-6 text-center">
                        <h2 className="text-3xl font-bold">Session complete</h2>
                        <p className="text-muted">
                            Your answers are being graded and will appear on the review page.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                to={`/session/${sessionId}`}
                                className="rounded-lg bg-accent px-5 py-2.5 font-medium text-canvas transition-colors hover:bg-accent-strong"
                            >
                                Review your answers
                            </Link>
                            <Link
                                to="/"
                                className="rounded-lg border border-line px-5 py-2.5 text-muted transition-colors hover:border-accent hover:text-ink"
                            >
                                Back to home
                            </Link>
                        </div>
                    </div>
                ) : questions.length === 0 ? (
                    /* LOADING view (a spinning ring) */
                    <div className="flex flex-col items-center gap-4 text-muted">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
                        <p>Loading interview...</p>
                    </div>
                ) : (
                    /* QUESTION view */
                    <>
                        {/* Question card */}
                        <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface p-10 text-center">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent">
                                {questions[currentIndex].type === 'intro' ? 'Introduction' : 'Behavioural'}
                            </p>
                            <p className="text-2xl font-medium leading-relaxed">
                                {questions[currentIndex].text}
                            </p>
                        </div>

                        {/* Recording controls */}
                        <div className="flex flex-col items-center gap-4">
                            {isRecording ? (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 rounded-full bg-red-500/90 px-6 py-3 font-medium text-white transition-colors hover:bg-red-500"
                                >
                                    {/* pulsing dot signals live recording */}
                                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                                    Stop recording
                                </button>
                            ) : (
                                <button
                                    onClick={startRecording}
                                    disabled={isPreparing}
                                    className="rounded-full bg-accent px-6 py-3 font-medium text-canvas transition-colors hover:bg-accent-strong disabled:opacity-50"
                                >
                                    {isPreparing ? 'Starting...' : audioUrl ? 'Re-record' : 'Record answer'}
                                </button>
                            )}

                            {micError && <p className="text-sm text-red-300">{micError}</p>}

                            {audioUrl && <audio key={audioUrl} src={audioUrl} controls className="mt-2" />}

                            {audioUrl && !isRecording && (
                                <button
                                    onClick={submitAnswer}
                                    className="rounded-lg bg-accent px-5 py-2.5 font-medium text-canvas transition-colors hover:bg-accent-strong"
                                >
                                    {currentIndex + 1 < questions.length ? 'Submit & continue' : 'Submit & finish'}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* Failed uploads banner (persists across questions) */}
                {failedUploads.length > 0 && (
                    <div className="w-full max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <p className="mb-2 text-sm text-red-300">
                            {failedUploads.length} answer(s) failed to upload:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {failedUploads.map((f, i) => (
                                <button
                                    key={i}
                                    onClick={() => retryUpload(f)}
                                    className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-300 transition-colors hover:bg-red-500/20"
                                >
                                    Retry "{f.question}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* EXIT CONFIRMATION MODAL */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
                        <h3 className="text-lg font-semibold">Exit session?</h3>
                        <p className="mt-2 text-sm text-muted">
                            This will permanently delete this session and any answers you've submitted.
                            This can't be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-ink"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={exitSession}
                                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                            >
                                Exit & delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InterviewPage
