import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute.tsx'

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
      <Route path="/login" element={<LoginPage />} />

    </Routes>
  )
}

export default App 
