from fastapi import APIRouter
from app.data.questions import QUESTIONS
import random

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/set")
def get_questions(mode: str ):
    behavioural = [q for q in QUESTIONS if q["type"] == "behavioural"]
    if mode == "single":
        return [random.choice(behavioural)]
    # Full session: Intro q + 3 behavioural
    intro = [q for q in QUESTIONS if q["type"] == "intro"]
    chosen = random.sample(behavioural, min(3, len(behavioural)))
    return intro + chosen