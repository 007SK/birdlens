import { useState } from 'react'

const CONFIDENCE_COLORS = {
  'Very likely': '#4CAF50',
  'Likely':      '#FF9800',
  'Possible':    '#607D8B',
}

function BirdPlaceholder() {
  return (
    <div className="species-card__img-placeholder" aria-label="No bird photo available">
      🐦
    </div>
  )
}

export default function SpeciesCard({ detection }) {
  const { species_common, species_scientific, confidence, confidence_label, image_url, fun_fact } = detection
  const [imgError, setImgError] = useState(false)
  const pct = Math.round(confidence * 100)
  const barColor = CONFIDENCE_COLORS[confidence_label] ?? '#607D8B'

  return (
    <div className="species-card">
      {image_url && !imgError
        ? <img
            className="species-card__img"
            src={image_url}
            alt={species_common}
            onError={() => setImgError(true)}
          />
        : <BirdPlaceholder />
      }

      <div className="species-card__body">
        <h3 className="species-card__common">{species_common}</h3>
        <p className="species-card__scientific">{species_scientific}</p>

        <div className="species-card__bar-wrap">
          <div
            className="species-card__bar"
            style={{ width: `${pct}%`, background: barColor }}
            role="meter"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="species-card__confidence" style={{ color: barColor }}>
          {confidence_label} · {pct}%
        </p>

        {fun_fact && <p className="species-card__fact">{fun_fact}</p>}
      </div>
    </div>
  )
}
