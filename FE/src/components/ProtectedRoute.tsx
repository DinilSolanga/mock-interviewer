import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

// This route is a wrapper, and it displays the contents it wraps only if a token is found
function ProtectedRoute({children}: {children: ReactNode}){
    const {token} = useAuth()

    if (!token) {
        return <Navigate to={"/login"} replace/> // Go to log in page if token not found
    }

    return children // If there IS a token, render whatever the token is wrapping
}
export default ProtectedRoute