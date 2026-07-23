from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.core.security import verify_token
from app.services.analysis import analyze_answer
from app.schemas.feedback import AnswerAnalysis
from app.core.database import get_supabase
from supabase import Client

router = APIRouter(prefix="/answers", tags=["answers"]) # Groups the endpoint in the answers heading in the /docs page

@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    question: str = Form(...),
    question_type: str = Form(...),
    session_id: str = Form(...),
    user: dict = Depends(verify_token),
    supabase: Client = Depends(get_supabase),
):
    contents = await file.read() # Reads and stores the files bytes as binary
    analysis = analyze_answer(contents, question, question_type) # Calls the analysis function to generate feedback

    # Insert the details into the database
    supabase.table("answers").insert({
        "session_id": session_id,
        "question": question,
        "question_type": question_type,
        "answer_text": analysis.transcript,
        "feedback": analysis.feedback.model_dump(),
        "overall_score": analysis.feedback.overall_score,
    }).execute()

    return analysis # Sends the analysis to the front end