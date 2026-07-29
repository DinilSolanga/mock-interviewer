import { useEffect, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts"

// Which metrics does this answer have? (depends on the question type)
function metricKeys(answer: any): string[] {
    return answer.question_type === "intro"
        ? ["structure", "relevance", "conciseness", "impact"]
        : ["situation", "task", "action", "result", "clarity"]
}

function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1)
}

// First sentence of a feedback string, trailing off with "..."
function firstSentence(text: string) {
    const end = text.search(/[.!?]/)
    const sentence = end === -1 ? text : text.slice(0, end)
    return sentence.trim() + "..."
}

// Convert a polar angle (degrees, screen coords: 0 = right, -90 = top) to an x/y point
function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

// SVG path for one pie wedge (metric i of n), centered on that metric's axis
function sectorPath(cx: number, cy: number, r: number, i: number, n: number) {
    const step = 360 / n
    const start = -90 + (i - 0.5) * step
    const end = -90 + (i + 0.5) * step
    const [x1, y1] = polar(cx, cy, r, start)
    const [x2, y2] = polar(cx, cy, r, end)
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

function ReviewPage() {
    const { sessionId } = useParams()
    const [answers, setAnswers] = useState<any[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [tooltip, setTooltip] = useState<{ key: string; x: number; y: number } | null>(null)
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null) // clicked wedge
    const chartRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadAnswers()

        const channel = supabase
            .channel(`answers-${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'answers', filter: `session_id=eq.${sessionId}` },
                (payload) => {
                    setAnswers((prev) => {
                        if (prev.some((a) => a.id === payload.new.id)) return prev
                        return [...prev, payload.new]
                    })
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    async function loadAnswers() {
        const { data, error } = await supabase
            .from('answers')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
        if (error) { console.error(error); return }
        setAnswers(data)
    }

    // Switch which question is shown, and reset the per-question hover/selection.
    function selectQuestion(i: number) {
        setSelectedIndex(i)
        setTooltip(null)
        setSelectedMetric(null)
    }

    const selected = answers[selectedIndex]
    const keys = selected ? metricKeys(selected) : []
    const radarData = keys.map((key) => ({
        key,
        metric: capitalise(key),
        score: selected.feedback[key].score,
    }))

    // The detail object for the currently-open metric (or null)
    const detail = selectedMetric ? selected.feedback[selectedMetric] : null

    function handleWedgeMove(e: React.MouseEvent, key: string) {
        const rect = chartRef.current!.getBoundingClientRect()
        setTooltip({ key, x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    return (
        <div className="flex min-h-screen flex-col">

            {/* HEADER */}
            <header className="flex items-center justify-between border-b border-line px-8 py-4">
                <span className="text-lg font-semibold">Session review</span>
                <Link to="/" className="text-sm text-muted transition-colors hover:text-ink">
                    Back to home
                </Link>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* SIDEBAR */}
                {sidebarOpen ? (
                    <aside className="w-72 shrink-0 overflow-y-auto border-r border-line p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Questions</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="rounded px-2 text-muted transition-colors hover:text-ink"
                                aria-label="Collapse sidebar"
                            >
                                {"<"}
                            </button>
                        </div>
                        {answers.length === 0 ? (
                            <p className="text-sm text-muted">No answers yet.</p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {answers.map((a, i) => (
                                    <li key={a.id}>
                                        <button
                                            onClick={() => selectQuestion(i)}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                i === selectedIndex
                                                    ? "border border-accent/30 bg-accent/15 text-accent"
                                                    : "border border-transparent text-muted hover:bg-elevated"
                                            }`}
                                        >
                                            <span className="block font-medium">Question {i + 1}</span>
                                            <span className="mt-0.5 block truncate text-xs">{a.question}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>
                ) : (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="shrink-0 border-r border-line px-3 text-muted transition-colors hover:text-ink"
                        aria-label="Expand sidebar"
                    >
                        {">"}
                    </button>
                )}

                {/* MAIN */}
                <main className="flex-1 overflow-y-auto p-8">
                    {answers.length === 0 ? (
                        <p className="text-muted">No answers in this session yet.</p>
                    ) : (
                        <div className="mx-auto flex max-w-4xl flex-col gap-6">
                            {/* Question + overall score */}
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                                    {selected.question_type === "intro" ? "Introduction" : "Behavioural"}
                                </p>
                                <h2 className="text-xl font-semibold">{selected.question}</h2>
                                <p className="mt-2 text-muted">
                                    Overall score:{" "}
                                    <span className="font-semibold text-ink">{selected.overall_score}/10</span>
                                </p>
                            </div>

                            {/* Radar + detail panel, side by side on large screens */}
                            <div className="rounded-2xl border border-line bg-surface p-4">
                                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

                                    {/* Chart (square) with the wedge overlay */}
                                    <div ref={chartRef} className="relative aspect-square w-full lg:max-w-md">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarData}>
                                                <PolarGrid stroke="#34343d" />
                                                <PolarAngleAxis dataKey="metric" tick={{ fill: "#9a9aa6", fontSize: 12 }} />
                                                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                                                <Radar dataKey="score" stroke="#c4b5fd" fill="#c4b5fd" fillOpacity={0.4} />
                                            </RadarChart>
                                        </ResponsiveContainer>

                                        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                                            {keys.map((key, i) => (
                                                <path
                                                    key={key}
                                                    d={sectorPath(50, 50, 50, i, keys.length)}
                                                    onMouseMove={(e) => handleWedgeMove(e, key)}
                                                    onMouseLeave={() => setTooltip(null)}
                                                    onClick={() => setSelectedMetric(key)}
                                                    // Selected wedge stays tinted; others tint only on hover
                                                    className={`cursor-pointer transition-colors ${
                                                        selectedMetric === key
                                                            ? "fill-accent/20"
                                                            : "fill-transparent hover:fill-accent/10"
                                                    }`}
                                                />
                                            ))}
                                        </svg>

                                        {tooltip && (
                                            <div
                                                className="pointer-events-none absolute z-10 max-w-xs rounded-lg border border-line bg-elevated px-3 py-2 shadow-lg"
                                                style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
                                            >
                                                <span className="text-xs font-semibold text-accent">
                                                    {capitalise(tooltip.key)} · {selected.feedback[tooltip.key].score}/10
                                                </span>
                                                <p className="mt-1 text-xs text-muted">
                                                    {firstSentence(selected.feedback[tooltip.key].feedback)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detail panel: full feedback for the clicked metric */}
                                    <div className="w-full lg:flex-1">
                                        {detail ? (
                                            <div className="rounded-xl bg-elevated p-5">
                                                <div className="flex items-baseline justify-between">
                                                    <h3 className="text-lg font-semibold text-accent">
                                                        {capitalise(selectedMetric!)}
                                                    </h3>
                                                    <span className="text-sm text-muted">{detail.score}/10</span>
                                                </div>
                                                <p className="mt-3 text-sm leading-relaxed text-ink">{detail.feedback}</p>

                                                {/* Rewrite suggestion (absent on clarity, or null when strong) */}
                                                {detail.rewrite_suggestion && (
                                                    <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                                                            Rewrite suggestion
                                                        </p>
                                                        <p className="mt-1 text-sm leading-relaxed text-ink">
                                                            {detail.rewrite_suggestion}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
                                                Click a section of the chart to see detailed feedback.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Transcript */}
                            <div className="rounded-2xl border border-line bg-surface p-6">
                                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                                    Your answer
                                </h3>
                                <p className="leading-relaxed text-ink">{selected.answer_text}</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default ReviewPage
