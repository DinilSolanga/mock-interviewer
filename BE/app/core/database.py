from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings
from app.core.security import bearer_scheme # Extracts the "Authorization: Bearer <token>" header from a request

def get_supabase(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
) -> Client:
    client = create_client(settings.supabase_url,settings.supabase_anon_key) # The supabase client
    client.postgrest.auth(credentials.credentials) # Attach the user's JWT token to every request
    return client