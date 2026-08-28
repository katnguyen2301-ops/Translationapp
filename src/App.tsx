import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { Learn } from './pages/Learn'
import { Lesson } from './pages/Lesson'
import { DialoguePage } from './pages/DialoguePage'
import { Roleplay } from './pages/Roleplay'
import { Profile } from './pages/Profile'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn/:lang" element={<Learn />} />
        <Route path="/learn/:lang/lesson/:lessonId" element={<Lesson />} />
        <Route path="/learn/:lang/dialogue/:dialogueId" element={<DialoguePage />} />
        <Route path="/learn/:lang/roleplay/:roleplayId" element={<Roleplay />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </HashRouter>
  )
}

export default App
