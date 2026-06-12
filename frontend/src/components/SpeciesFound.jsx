import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function SpeciesFound() {
  const [species, setSpecies] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getDiscoveries()
      .then(d => setSpecies(d.species))
      .catch(e => setError(e.message))
  }, [])

  if (error) {
    return <div className="inline-error">{error}</div>
  }

  if (species === null) {
    return (
      <div className="global-feed">
        <div className="global-feed__heading">Species Found</div>
        <div className="global-feed__loading">Loading species...</div>
      </div>
    )
  }

  if (species.length === 0) {
    return (
      <div className="global-feed">
        <div className="global-feed__heading">Species Found</div>
        <div className="global-feed__empty">No species detected yet. Make your first recording.</div>
      </div>
    )
  }

  return (
    <div className="global-feed">
      <div className="global-feed__heading">Species Found</div>
      <ul className="global-feed__list">
        {species.map(s => (
          <li key={s.species_scientific} className="discovery-row">
            {s.image_url
              ? <img src={s.image_url} alt={s.species_common} className="discovery-row__img" />
              : <div className="discovery-row__img-placeholder">🐦</div>
            }
            <div className="discovery-row__body">
              <div className="discovery-row__common">{s.species_common}</div>
              <div className="discovery-row__scientific">{s.species_scientific}</div>
              {s.location_label && (
                <span className="discovery-row__location">📍 {s.location_label}</span>
              )}
              <div className="discovery-row__meta">
                Detected {s.total_detections} time{s.total_detections !== 1 ? 's' : ''} · {timeAgo(s.last_detected)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
