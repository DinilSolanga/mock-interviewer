"""Pydantic models for the AI feedback structure."""
from pydantic import BaseModel

class ScoredComponent(BaseModel):
    score: int
    feedback: str
    rewrite_suggestion: str | None

class Clarity(BaseModel):
    score: int
    feedback: str

# --- Behavioural (STAR) ---
class Feedback(BaseModel):
    situation: ScoredComponent
    task: ScoredComponent
    action: ScoredComponent
    result: ScoredComponent
    clarity: Clarity
    overall_score: int

class AnswerAnalysis(BaseModel):
    transcript: str
    feedback: Feedback

# --- Intro ("tell me about yourself") ---
class IntroFeedback(BaseModel):
    structure: ScoredComponent
    relevance: ScoredComponent
    conciseness: ScoredComponent
    impact: ScoredComponent
    overall_score: int

class IntroAnalysis(BaseModel):
    transcript: str
    feedback: IntroFeedback