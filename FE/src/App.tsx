import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import InterviewPage from './pages/InterviewPage.tsx'

function App() {
  return (
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
    </Routes>
  )
}

export default App 
