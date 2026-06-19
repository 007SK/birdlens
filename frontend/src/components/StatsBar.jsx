import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'
import swatiPhoto from '../assets/swati.jpg'

export default function StatsBar({ stats: propStats, onStatsLoaded }) {
  const [stats, setStats] = useState(propStats ?? null)
  const [loading, setLoading] = useState(propStats == null)
  const [error, setError] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (propStats != null) {
      setStats(propStats)
      setLoading(false)
      return
    }
    api.getStats()
      .then((data) => {
        setStats(data)
        setError(false)
        onStatsLoaded?.(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [propStats])

  useEffect(() => {
    if (!cardOpen) return
    function onMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setCardOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [cardOpen])

  const val = (key) => loading ? '…' : (stats?.[key] ?? '—')

  return (
    <div className="stats-bar-wrapper" ref={wrapperRef}>
      <div className="stats-bar">
        {error && !loading ? (
          <span className="stats-bar__error">Unable to load — please refresh the page</span>
        ) : (
          <p className="stats-bar__sentence">
            <span className="stats-bar__chunk">🎙 <strong className="stats-bar__num">{val('total_runs')}</strong> recordings ·&nbsp;</span>
            <span className="stats-bar__chunk">🐦 <strong className="stats-bar__num">{val('unique_species')}</strong> unique species discovered</span>
          </p>
        )}
        <button
          className="stats-bar__branding"
          onClick={() => setCardOpen(o => !o)}
        >
          Built by Swati 🌻
        </button>
      </div>
      {cardOpen && (
        <div className="stats-bar__card">
          <img src={swatiPhoto} alt="Swati Kumari" className="stats-bar-card__photo" />
          <div className="stats-bar-card__body">
            <p className="stats-bar-card__name">Swati Kumari</p>
            <p className="stats-bar-card__story">
              When I moved from the city to the mountains, traffic sounds got replaced by birdsong I couldn't recognize. I'm a nature lover who likes building things, so I set up this platform to try it out myself, and I've since learned 25+ new species just from their calls.
            </p>
            <div className="stats-bar-card__links">
              <a href="https://github.com/007SK" target="_blank" rel="noreferrer" className="stats-bar-card__link">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/007sk/" target="_blank" rel="noreferrer" className="stats-bar-card__link">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
