from fastapi import FastAPI, Depends, UploadFile, File
from app.core.security import verify_token # Imports the JWT verification dependenct
from fastapi.middleware.cors import CORSMiddleware
from app.routers import answers

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # The frontend origins
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(answers.router)

@app.get("/")
def read_root():
    return {"message": "Hello from the interviewer backend"}

@app.get("/me")
def read_me(user: dict = Depends(verify_token)):
    return {"user_id": user["sub"], "email": user.get("email")}