import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const BADGE_COLORS = {
  'Very likely': '#4CAF50',
  'Likely':      '#FF9800',
  'Possible':    '#607D8B',
}

function confidenceLabel(conf) {
  if (conf >= 0.75) return 'Very likely'
  if (conf >= 0.55) return 'Likely'
  return 'Possible'
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
  const label = confidenceLabel(species.confidence)
  const badgeColor = BADGE_COLORS[label]

  return (
    <div className="feed-card__species-row">
      {species.image_url && !imgError
        ? <img
            className="feed-card__img"
            src={species.image_url}
            alt={species.species_common}
            onError={() => setImgError(true)}
          />
        : <div className="feed-card__img-placeholder">🐦</div>
      }
      <span className="feed-card__name">{species.species_common}</span>
      <span className="feed-badge" style={{ background: badgeColor }}>{label}</span>
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
            const topSpecies = run.top_species ?? []

            return (
              <li key={run.run_id} className="feed-card">
                <div className="feed-card__meta">
                  {icon} {run.duration_seconds}s · {relativeTime(run.created_at)}
                </div>
                {topSpecies.length === 0
                  ? <p className="feed-card__empty">No detections above threshold</p>
                  : topSpecies.map((s) => (
                      <FeedSpeciesRow key={s.species_common} species={s} />
                    ))
                }
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
