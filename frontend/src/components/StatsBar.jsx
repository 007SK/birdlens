import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function StatsBar({ stats: propStats, onStatsLoaded }) {
  const [stats, setStats] = useState(propStats ?? null)
  const [loading, setLoading] = useState(propStats == null)
  const [error, setError] = useState(false)

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

  const val = (key) => loading ? '…' : (stats?.[key] ?? '—')

  return (
    <div className="stats-bar">
      {error && !loading ? (
        <span className="stats-bar__error">Unable to load — please refresh the page</span>
      ) : (
        <p className="stats-bar__sentence">
          <span className="stats-bar__chunk">🎙 <strong className="stats-bar__num">{val('total_runs')}</strong> recordings ·&nbsp;</span>
          <span className="stats-bar__chunk">🐦 <strong className="stats-bar__num">{val('unique_species')}</strong> species discovered</span>
        </p>
      )}
    </div>
  )
}
