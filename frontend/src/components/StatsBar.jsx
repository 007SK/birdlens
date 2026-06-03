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

  const val = (key) => loading ? '...' : (stats?.[key] ?? '—')

  return (
    <div className="stats-bar">
      {error && !loading ? (
        <span className="stats-bar__error">Service is starting up, please try again in 30 seconds.</span>
      ) : (
        <>
          <span className="stats-bar__item">
            <span className="stats-bar__value">{val('total_runs')}</span>
            <span className="stats-bar__label">Recordings</span>
          </span>
          <span className="stats-bar__item">
            <span className="stats-bar__value">{val('total_detections')}</span>
            <span className="stats-bar__label">Detections</span>
          </span>
          <span className="stats-bar__item">
            <span className="stats-bar__value">{val('unique_species')}</span>
            <span className="stats-bar__label">Species</span>
          </span>
        </>
      )}
    </div>
  )
}
