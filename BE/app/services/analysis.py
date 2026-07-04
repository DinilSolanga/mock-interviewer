import io
from pydub import AudioSegment
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.feedback import AnswerAnalysis

client = genai.Client(api_key=settings.gemini_api_key)

PROMPT = """
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
def analyze_answer(webm_bytes: bytes, question: str) -> AnswerAnalysis:
    # 1. Convert webm to wav (Gemini doesn't accept webm)
    audio = AudioSegment.from_file(io.BytesIO(webm_bytes), format="webm")
    buffer = io.BytesIO()
    audio.export(buffer, format="wav")
    wav_bytes = buffer.getvalue()

    # 2. Send the wav to Gemini and ask for feedback
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            PROMPT.format(question=question),
            types.Part.from_bytes(data=wav_bytes, mime_type="audio/wav"), # Attaches the file to the request
        ],
        # Specify the response structure
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AnswerAnalysis,
        ),
    )
    return(response.parsed) # Enforces structured output in the correct format