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

const STORY = "When I moved from the city to the mountains, traffic sounds got replaced by birdsongs I couldn't recognize. I'm a nature lover who likes building things, so I set up this platform. With feedback and recordings from fellow nature lovers who've tried it, we've now identified 25+ unique species just from their calls."

const GH_PATH = "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
const LI_PATH = "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"

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
              <div className="byline-tooltip__icons">
                <a href="https://github.com/007SK" target="_blank" rel="noreferrer" className="byline-tooltip__icon-link">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d={GH_PATH} />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/007sk/" target="_blank" rel="noreferrer" className="byline-tooltip__icon-link">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d={LI_PATH} />
                  </svg>
                </a>
              </div>
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

        {view === 'record' && <GlobalFeed refreshTrigger={feedTick} />}
      </main>

      <Footer />
    </div>
  )
}
