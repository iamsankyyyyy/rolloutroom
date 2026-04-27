import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AccountPage from './pages/AccountPage'
import TasksPage from './pages/TasksPage'
import AgentChatsPage from './pages/AgentChatsPage'
import AgentChatIndexPage from './pages/AgentChatIndexPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'agent-chats', element: <AgentChatsPage /> },
      { path: 'agent-chats/:agentId', element: <AgentChatIndexPage /> },
      { path: 'agent-desk', element: <Navigate to="/agent-chats" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])