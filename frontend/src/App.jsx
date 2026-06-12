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

export default function App() {
  const [activeTab, setActiveTab] = useState('record')
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
        <p className="app-tagline">Record or upload audio and discover the birds around you</p>
      </header>

      <main className="app-main">
        <section className="location-section">
          <LocationInput />
        </section>

        <section className="capture-section">
          <div className="capture-tabs">
            <button
              className={`tab ${activeTab === 'record' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('record')}
            >
              Record
            </button>
            <button
              className={`tab ${activeTab === 'upload' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Audio File
            </button>
            <button
              className={`tab ${activeTab === 'species' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('species')}
            >
              Species Found
            </button>
          </div>
          <div className="tab-panel">
            {activeTab === 'species'
              ? <SpeciesFound />
              : activeTab === 'record'
                ? <RecordTab onResult={handleResult} />
                : <UploadTab onResult={handleResult} />
            }
          </div>
        </section>

        {activeTab !== 'species' && result && <ResultsCard result={result} />}

        <GlobalFeed refreshTrigger={feedTick} />
      </main>

      <Footer />
    </div>
  )
}
