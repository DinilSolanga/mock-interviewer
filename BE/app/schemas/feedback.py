"""Pydantic models for the AI feedback structure."""
from pydantic import BaseModel

class StarComponent(BaseModel):
    score: int
    feedback: str
    rewrite_suggestion: str | None

class Clarity(BaseModel):
    score: int
    feedback: str

class Feedback(BaseModel):
    situation: StarComponent
    task: StarComponent
    action: StarComponent
    result: StarComponent
    clarity: Clarity
    overall_score: int

class AnswerAnalysis(BaseModel):
    transcript: str
    feedback: Feedback