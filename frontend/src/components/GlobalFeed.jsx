import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60)  return 'just now'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`
  }
  const d = Math.floor(diff / 86400)
  return `${d} ${d === 1 ? 'day' : 'days'} ago`
}

export default function GlobalFeed({ refreshTrigger }) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.getFeed()
      .then((data) => { setRuns(data.runs ?? []); setError(false) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [refreshTrigger])

  return (
    <section className="global-feed">
      <h2 className="global-feed__heading">Recent detections from all visitors</h2>

      {loading && <p className="global-feed__loading">Loading…</p>}

      {!loading && error && (
        <p className="global-feed__empty">Service is starting up, please try again in 30 seconds.</p>
      )}

      {!loading && !error && runs.length === 0 && (
        <p className="global-feed__empty">No recordings yet. Be the first.</p>
      )}

      {!loading && !error && runs.length > 0 && (
        <ul className="global-feed__list">
          {runs.slice(0, 10).map((run) => {
            const icon = run.source === 'mic' ? '🎙' : '⬆️'
            const topSpeciesList = (run.top_species ?? []).slice(0, 2)

            return (
              <li key={run.run_id} className="feed-entry">
                <span className="feed-entry__time">{relativeTime(run.created_at)}</span>
                <span className="feed-entry__detail">
                  {icon} {run.duration_seconds}s
                  {topSpeciesList.length > 0
                    ? topSpeciesList.map((s, i) => (
                        <span key={s.species_common}>
                          {i === 0 ? ' · ' : ', '}
                          <strong className="feed-entry__species">{s.species_common}</strong>
                          {' '}
                          <span className="feed-entry__pct">
                            ({Math.round(s.confidence * 100)}%)
                          </span>
                        </span>
                      ))
                    : ' · No detections'
                  }
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
