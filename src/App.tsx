import { Route, Routes, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { TeacherDashboard } from './pages/teacher/TeacherDashboard'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { TeacherTasksPage } from './pages/teacher/TeacherTasksPage'
import { TeacherTaskFormPage } from './pages/teacher/TeacherTaskFormPage'
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage'
import { TeacherStatsPage } from './pages/teacher/TeacherStatsPage'
import { StudentTasksPage } from './pages/student/StudentTasksPage'
import { StudentTaskDetailPage } from './pages/student/StudentTaskDetailPage'
import { StudentResultsPage } from './pages/student/StudentResultsPage'
import { StudentRankingPage } from './pages/student/StudentRankingPage'
import { StudentAchievementsPage } from './pages/student/StudentAchievementsPage'
import { StudentProfilePage } from './pages/student/StudentProfilePage'
import { MiniGamesPage } from './pages/student/MiniGamesPage'
import { AppShell } from './layout/AppShell'

function App() {
	return (
		<div className='min-h-screen bg-slate-950 text-slate-50'>
			<Routes>
				<Route path='/' element={<LandingPage />} />
				<Route path='/auth' element={<AuthPage />} />
				{/* Teacher yo‘llari */}
				<Route
					path='/teacher'
					element={
						<AppShell variant='teacher'>
							<TeacherDashboard />
						</AppShell>
					}
				/>
				<Route
					path='/teacher/tasks'
					element={
						<AppShell variant='teacher'>
							<TeacherTasksPage />
						</AppShell>
					}
				/>
				<Route
					path='/teacher/tasks/create'
					element={
						<AppShell variant='teacher'>
							<TeacherTaskFormPage />
						</AppShell>
					}
				/>
				<Route
					path='/teacher/tasks/edit/:taskId'
					element={
						<AppShell variant='teacher'>
							<TeacherTaskFormPage />
						</AppShell>
					}
				/>
				<Route
					path='/teacher/students'
					element={
						<AppShell variant='teacher'>
							<TeacherStudentsPage />
						</AppShell>
					}
				/>
				<Route
					path='/teacher/stats'
					element={
						<AppShell variant='teacher'>
							<TeacherStatsPage />
						</AppShell>
					}
				/>
				{/* Student yo‘llari */}
				<Route
					path='/student'
					element={
						<AppShell variant='student'>
							<StudentDashboard />
						</AppShell>
					}
				/>
				<Route
					path='/student/tasks'
					element={
						<AppShell variant='student'>
							<StudentTasksPage />
						</AppShell>
					}
				/>
				<Route
					path='/student/tasks/:taskId'
					element={
						<AppShell variant='student'>
							<StudentTaskDetailPage />
						</AppShell>
					}
				/>
				<Route
					path='/student/results'
					element={
						<AppShell variant='student'>
							<StudentResultsPage />
						</AppShell>
					}
				/>
				<Route
					path='/student/ranking'
					element={
						<AppShell variant='student'>
							<StudentRankingPage />
						</AppShell>
					}
				/>
				<Route
					path='/student/achievements'
					element={
						<AppShell variant='student'>
							<StudentAchievementsPage />
						</AppShell>
					}
				/>
				<Route
					path='/student/profile'
					element={
						<AppShell variant='student'>
							<StudentProfilePage />
						</AppShell>
					}
				/>
				<Route
					path='/student/games'
					element={
						<AppShell variant='student'>
							<MiniGamesPage />
						</AppShell>
					}
				/>
				<Route path='*' element={<Navigate to='/' replace />} />
			</Routes>
		</div>
	)
}

export default App
