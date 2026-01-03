import { createHashRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import EntryPage from './pages/EntryPage'
import AnalysisPage from './pages/AnalysisPage'
import SettingsPage from './pages/SettingsPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <EntryPage /> },
      { path: 'analysis', element: <AnalysisPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

