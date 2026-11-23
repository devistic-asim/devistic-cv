import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PrivacyNotice } from './components/PrivacyNotice'
import { Dashboard } from './pages/Dashboard'
import { EditorPage } from './pages/EditorPage'
import { Landing } from './pages/Landing'
import { Wizard } from './pages/Wizard'
import { useCvStore } from './store/useCvStore'

export function App() {
  const load = useCvStore((state) => state.load)
  useEffect(() => {
    void load()
  }, [load])
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (
    <BrowserRouter basename={basename}>
      <div className="flex h-dvh flex-col bg-bg text-text">
        <PrivacyNotice />
        <div className="min-h-0 flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/documents" element={<Dashboard />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
