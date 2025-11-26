import { SOURCES } from '../utils/constants';

/**
 * Composant pour basculer entre les sources de données
 */
export function SourceToggle({ source, onChange }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Source de données
      </label>
      <div className="flex gap-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="source"
            value={SOURCES.TURF_FR}
            checked={source === SOURCES.TURF_FR}
            onChange={(e) => onChange(e.target.value)}
            className="mr-2"
          />
          <span>Turf-FR (HTML)</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="source"
            value={SOURCES.PMU_JSON}
            checked={source === SOURCES.PMU_JSON}
            onChange={(e) => onChange(e.target.value)}
            className="mr-2"
          />
          <span>PMU JSON</span>
        </label>
      </div>
    </div>
  );
}

