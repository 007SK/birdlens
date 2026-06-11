import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const BADGE_STYLES = {
  'Very likely': { bg: '#e8f5e9', color: '#2e7d32' },
  'Likely':      { bg: '#fff8e1', color: '#f57f17' },
  'Possible':    { bg: '#eceff1', color: '#546e7a' },
}

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

function FeedSpeciesRow({ species }) {
  const [imgError, setImgError] = useState(false)
  const badge = BADGE_STYLES[species.confidence_label] ?? BADGE_STYLES['Possible']

  return (
    <div className="feed-species-row">
      {species.image_url && !imgError
        ? <img
            className="feed-species-row__img"
            src={species.image_url}
            alt={species.species_common}
            onError={() => setImgError(true)}
          />
        : <div className="feed-species-row__img-placeholder">🐦</div>
      }
      <span className="feed-species-row__name">{species.species_common}</span>
      <span className="feed-badge" style={{ background: badge.bg, color: badge.color }}>
        {species.confidence_label}
      </span>
    </div>
  )
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

  const runsWithDetections = runs.filter((run) => (run.detections ?? []).length > 0)

  return (
    <section className="global-feed">
      <h2 className="global-feed__heading">Recent detections from all visitors</h2>

      {loading && <p className="global-feed__loading">Loading…</p>}

      {!loading && error && (
        <p className="global-feed__empty">Unable to load — please refresh the page</p>
      )}

      {!loading && !error && runsWithDetections.length === 0 && (
        <p className="global-feed__empty">No recordings yet. Be the first.</p>
      )}

      {!loading && !error && runsWithDetections.length > 0 && (
        <ul className="global-feed__list">
          {runsWithDetections.map((run) => {
            const icon = run.source === 'mic' ? '🎙' : '⬆️'
            const detections = run.detections ?? []

            return (
              <li key={run.run_id} className="feed-card">
                <div className="feed-card__meta">
                  {icon} {run.duration_seconds}s · {relativeTime(run.created_at)}
                </div>
                <div className="feed-card__species-list">
                  {detections.map((s) => (
                    <FeedSpeciesRow key={s.species_common} species={s} />
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
