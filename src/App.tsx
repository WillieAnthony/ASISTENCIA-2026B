import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RegistroProvider } from './context/RegistroContext'
import { StudentRegister } from './pages/StudentRegister'
import { TeacherDashboard } from './pages/TeacherDashboard'

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

  return (
    <RegistroProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<StudentRegister />} />
          <Route path="/r/:salonId" element={<StudentRegister />} />
          <Route path="/admin" element={<TeacherDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RegistroProvider>
  )
}
