from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.core.security import verify_token
from app.services.analysis import analyze_answer
from app.schemas.feedback import AnswerAnalysis

router = APIRouter(prefix="/answers", tags=["answers"]) # Groups the endpoint in the answers heading in the /docs page

@router.post("/audio", response_model=AnswerAnalysis)
async def upload_audio(
    file: UploadFile = File(...),
    question: str = Form(...),
    user: dict = Depends(verify_token),
):
    contents = await file.read() # Reads and stores the files bytes as binary
    return analyze_answer(contents, question) # Calls the analysis function to generate feedback