import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ChatListPage from './pages/ChatListPage'
import ChatPage from './pages/ChatPage'
import LogsPage from './pages/LogsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'chat', element: <ChatListPage /> },
      { path: 'chat/:id', element: <ChatPage /> },
      { path: 'logs', element: <LogsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
