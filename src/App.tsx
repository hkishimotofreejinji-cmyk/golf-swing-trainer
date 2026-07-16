import { HashRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Record from './pages/Record'
import Analyze from './pages/Analyze'
import History from './pages/History'
import Rounds from './pages/Rounds'
import Knowledge from './pages/Knowledge'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/record" element={<Record />} />
            <Route path="/analyze/:sessionId" element={<Analyze />} />
            <Route path="/history" element={<History />} />
            <Route path="/rounds" element={<Rounds />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <NavBar />
      </div>
    </HashRouter>
  )
}

export default App
