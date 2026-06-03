import SpeciesCard from './SpeciesCard.jsx'

export default function ResultsCard({ result }) {
  const { duration_seconds, detections } = result

  return (
    <div className="results-card">
      <div className="results-card__header">
        <span className="results-card__meta">
          {duration_seconds}s recording &nbsp;·&nbsp;
          {detections.length} {detections.length === 1 ? 'species' : 'species'} detected &nbsp;·&nbsp;
          just now
        </span>
      </div>

      {detections.length === 0 ? (
        <p className="results-card__empty">
          Nothing detected above the confidence threshold. Try recording in a quieter spot or closer to the sound.
        </p>
      ) : (
        <div className="results-card__list">
          {detections.map((d) => (
            <SpeciesCard key={d.species_scientific} detection={d} />
          ))}
        </div>
      )}
    </div>
  )
}
