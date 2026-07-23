import io
from pydub import AudioSegment
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.feedback import AnswerAnalysis, IntroAnalysis

client = genai.Client(api_key=settings.gemini_api_key)

INTRO_PROMPT = """You are an expert interview coach analysing a candidate's spoken answer to "Tell me about yourself".
The candidate was asked: "{question}"
Listen to the attached audio, then:
1. Transcribe the answer verbatim.
2. Evaluate on these dimensions — each an integer 0-10 with specific, actionable feedback grounded in what they said:
- structure: Well-organised (e.g. present → past → future, or a clear narrative)?
- relevance: Highlights experience/strengths relevant to a professional context?
- conciseness: Focused and appropriately brief, not rambling?
- impact: Makes a strong, memorable impression?
Include a rewrite_suggestion for weak dimensions, null if strong or insufficient words to provide useful suggestions.
overall_score is your holistic 0-10 rating."""

STAR_PROMPT = """
    You are an expert interview coach analysing a candidate's spoken answer to a \
    behavioural interview question.

    The candidate was asked: "{question}"
    Listen to their spoken answer in the attached audio, then:
    1. Transcribe the answer verbatim.
    2. Provide feedback

    Evaluate the answer using the STAR framework plus overall clarity. For each \
    dimension, give an integer score from 0 to 10 and a specific, actionable \
    observation grounded in what the candidate actually said — never generic praise.

    - situation: Did they set clear context (when, where, their role)?
    - task: Did they explain the goal or challenge they were responsible for?
    - action: Did they describe the specific steps THEY took (not the team)?
    - result: Did they share concrete, ideally quantified, outcomes?
    - clarity: Was the answer well-structured, concise, and easy to follow?

    For situation, task, action and result, include a `rewrite_suggestions` string \
    with a concrete improvement ONLY when the component is weak. If the component is \
    already strong, set `rewrite_suggestions` to null. Clarity must never include \
    rewrite suggestions.

    `overall_score` is your holistic 0-10 rating of the whole answer.
"""
def analyze_answer(webm_bytes: bytes, question: str, question_type: str) -> AnswerAnalysis | IntroAnalysis:
    # 1. Convert webm to wav (Gemini doesn't accept webm)
    audio = AudioSegment.from_file(io.BytesIO(webm_bytes), format="webm")
    buffer = io.BytesIO()
    audio.export(buffer, format="wav")
    wav_bytes = buffer.getvalue()

    # 2. Pick the rubric based on the question type
    if question_type == "intro":
        prompt, schema = INTRO_PROMPT, IntroAnalysis
    else:
        prompt, schema = STAR_PROMPT, AnswerAnalysis

    # 3. Send the wav to Gemini and ask for feedback
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt.format(question=question),
            types.Part.from_bytes(data=wav_bytes, mime_type="audio/wav"), # Attaches the file to the request
        ],
        # Specify the response structure
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
        ),
    )
    return(response.parsed) # Enforces structured output in the correct format