import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/documents" element={<Dashboard />} />
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
