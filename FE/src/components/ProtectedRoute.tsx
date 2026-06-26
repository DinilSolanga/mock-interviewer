import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

// This route is a wrapper, and it displays the contents it wraps only if a session is found
function ProtectedRoute({children}: {children: ReactNode}){
    const {session, loading} = useAuth()
    if (loading) return <p>Loading...</p>
    if (!session) {
        return <Navigate to={"/login"} replace/> // Go to log in page if session not found
    }

    return children // If there IS a session, render whatever the route is wrapping
}
export default ProtectedRoute