const CONFIDENCE_COLORS = {
  'Very likely': '#4CAF50',
  'Likely':      '#FF9800',
  'Possible':    '#607D8B',
}

function BirdPlaceholder() {
  return (
    <div className="species-card__img-placeholder" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
        <path
          d="M32 12c-6 0-11 4-13 9-3 1-6 4-6 8 0 3 2 6 5 7l1 8h26l1-8c3-1 5-4 5-7
             0-4-3-7-6-8-2-5-7-9-13-9z"
          fill="#c8d8c8"
        />
        <circle cx="38" cy="22" r="2" fill="#5a7a5a" />
        <path d="M20 29 c-4 2-7 1-8-1" stroke="#5a7a5a" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function SpeciesCard({ detection }) {
  const { species_common, species_scientific, confidence, confidence_label, image_url, fun_fact } = detection
  const pct = Math.round(confidence * 100)
  const barColor = CONFIDENCE_COLORS[confidence_label] ?? '#607D8B'

  return (
    <div className="species-card">
      {image_url
        ? <img
            className="species-card__img"
            src={image_url}
            alt={species_common}
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
          />
        : null
      }
      {!image_url && <BirdPlaceholder />}
      {image_url && <div className="species-card__img-placeholder" style={{ display: 'none' }}><BirdPlaceholder /></div>}

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
