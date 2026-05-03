import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import StudentsPage from './pages/StudentsPage'
import CoursesPage from './pages/CoursesPage'
import SessionsPage from './pages/SessionsPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AttendancePage from './pages/AttendancePage'
import LeaderboardPage from './pages/LeaderboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CohortPage from './pages/CohortPage'
import StudentProfilePage from './pages/StudentProfilePage'
import OpportunitiesPage from './pages/OpportunitiesPage'
import PrivacyPage from './pages/PrivacyPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/cohort" element={<CohortPage />} />
        <Route path="/cohort/:studentId" element={<StudentProfilePage />} />
        <Route path="/explore" element={<OpportunitiesPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        {/* Catch-all route for 404 */}
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

export default App
