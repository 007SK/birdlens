import { useEffect, useRef, useState } from 'react'
import './App.css'
import StatsBar from './components/StatsBar.jsx'
import RecordTab from './components/RecordTab.jsx'
import UploadTab from './components/UploadTab.jsx'
import ResultsCard from './components/ResultsCard.jsx'
import GlobalFeed from './components/GlobalFeed.jsx'
import LocationInput from './components/LocationInput.jsx'
import SpeciesFound from './components/SpeciesFound.jsx'
import Footer from './components/Footer.jsx'
import SecondaryActions from './components/SecondaryActions.jsx'
import swatiPhoto from './assets/swati.jpg'

const STORY = "When I moved from the city to the mountains, traffic sounds got replaced by birdsong I couldn't recognize. I'm a nature lover who likes building things, so I set up this platform to try it out myself, and I've since learned 25+ new species just from their calls."

export default function App() {
  const [view, setView] = useState('record')
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState(null)
  const [feedTick, setFeedTick] = useState(0)
  const [bylineOpen, setBylineOpen] = useState(false)
  const bylineRef = useRef(null)
  const closeTimerRef = useRef(null)

  function handleResult(data) {
    setResult(data)
    if (data.stats) setStats(data.stats)
    setFeedTick((t) => t + 1)
  }

  // Click-outside dismissal for mobile tap
  useEffect(() => {
    if (!bylineOpen) return
    function onMouseDown(e) {
      if (bylineRef.current && !bylineRef.current.contains(e.target)) {
        setBylineOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [bylineOpen])

  function bylineEnter() {
    clearTimeout(closeTimerRef.current)
    setBylineOpen(true)
  }

  function bylineLeave() {
    // Small delay so moving mouse to the tooltip doesn't flicker it closed
    closeTimerRef.current = setTimeout(() => setBylineOpen(false), 150)
  }

  return (
    <div className="app">
      <StatsBar stats={stats} onStatsLoaded={setStats} />

      <header className="app-header">
        <h1 className="app-title">BirdLens</h1>
        <div
          className="app-byline-wrap"
          ref={bylineRef}
          onMouseEnter={bylineEnter}
          onMouseLeave={bylineLeave}
          onClick={() => setBylineOpen(o => !o)}
        >
          <p className="app-byline">Built by Swati 🌻</p>
          {bylineOpen && (
            <div
              className="byline-tooltip"
              onMouseEnter={bylineEnter}
              onMouseLeave={bylineLeave}
            >
              <div className="byline-tooltip__header">
                <img src={swatiPhoto} alt="Swati Kumari" className="byline-tooltip__photo" />
                <span className="byline-tooltip__name">Swati Kumari</span>
              </div>
              <p className="byline-tooltip__story">{STORY}</p>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {view !== 'record' && (
          <button className="back-link" onClick={() => setView('record')}>
            ← Back to recording
          </button>
        )}

        {view === 'record' && (
          <div className="record-hero">
            <RecordTab onResult={handleResult} />
            <LocationInput />
            <SecondaryActions
              onUpload={() => setView('upload')}
              onSpecies={() => setView('species')}
            />
          </div>
        )}

        {view === 'upload' && (
          <UploadTab onResult={(data) => { handleResult(data); setView('record') }} />
        )}

        {view === 'species' && <SpeciesFound />}

        {view !== 'species' && result && <ResultsCard result={result} />}

        <GlobalFeed refreshTrigger={feedTick} />
      </main>

      <Footer />
    </div>
  )
}
