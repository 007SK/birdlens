import { useState } from 'react'
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

export default function App() {
  const [view, setView] = useState('record') // 'record' | 'upload' | 'species'
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState(null)
  const [feedTick, setFeedTick] = useState(0)

  function handleResult(data) {
    setResult(data)
    if (data.stats) setStats(data.stats)
    setFeedTick((t) => t + 1)
  }

  return (
    <div className="app">
      <StatsBar stats={stats} onStatsLoaded={setStats} />

      <header className="app-header">
        <h1 className="app-title">BirdLens</h1>
        <p className="app-byline">Built by Swati 🌻</p>
      </header>

      <main className="app-main">
        {view !== 'record' && (
          <button className="back-link" onClick={() => setView('record')}>
            ← Back to recording
          </button>
        )}

        {view === 'record' && (
          <>
            <RecordTab onResult={handleResult} />
            <LocationInput />
            <SecondaryActions
              onUpload={() => setView('upload')}
              onSpecies={() => setView('species')}
            />
          </>
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
