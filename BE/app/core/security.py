"""Supabase JWT verification used as a FastAPI dependency."""
import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv() # Reads BE/.env environment variables

SUPABASE_URL = os.environ["SUPABASE_URL"]
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" # Address of Supabase's JWKS(JSON Web Key Set) endpoint
ISSUER = f"{SUPABASE_URL}/auth/v1"
AUDIENCE = "authenticated" # What kind of users/audience has access

# Fetches & caches Supabase's public key from the JWKS endpoint
jwks_client = PyJWKClient(JWKS_URL)

# Extracts the "Authorization: Bearer <token>" header from a request
bearer_scheme = HTTPBearer()

# The dependency that verifies the JWT token
def verify_token(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme) # Only runs if HTTPBearer succesfully finds the Bearer header
) -> dict: # Dict is the expected return type (-> is a type hint)
    token = credentials.credentials # The raw JWT as a string
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token) # Extracts the public key from the tokens key id
        # The actual verification (The signature itself, the algorithm, if the audience is authenticated, and the issuer matches)
        payload = jwt.decode(
            token,
            signing_key.key, # The public key
            algorithms=["ES256"], 
            audience=AUDIENCE,
            issuer=ISSUER,
        )
    except Exception: # Raise a 401 Error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return payload # The decoded claims: sub(User ID), email, etc

