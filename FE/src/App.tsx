import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import InterviewPage from './pages/InterviewPage.tsx'
import ReviewPage from './pages/ReviewPage.tsx'
import { Analytics } from "@vercel/analytics/next"


function App() {
  return (
    <>
      <Routes>
        
        <Route 
          path="/" 
          element={
              <ProtectedRoute>
                  <HomePage />
              </ProtectedRoute> // Guards the homepage route
          } />
        <Route path='/register' element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path='/interview/:sessionId' element={
          <ProtectedRoute>
            <InterviewPage/>
          </ProtectedRoute>
        } />
        <Route path='/session/:sessionId' element={
          <ProtectedRoute>
            <ReviewPage/>
          </ProtectedRoute>
        } />
      </Routes>
      <Analytics />
    </>
  )
}

export default App 
