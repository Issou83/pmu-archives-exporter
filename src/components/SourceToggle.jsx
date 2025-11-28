import { SOURCES } from '../utils/constants';

/**
 * Composant pour basculer entre les sources de données - Design moderne
 */
export function SourceToggle({ source, onChange }) {
  return (
    <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
      <label className="block text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        📊 Source de données
      </label>
      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex-1 group cursor-pointer">
          <input
            type="radio"
            name="source"
            value={SOURCES.TURF_FR}
            checked={source === SOURCES.TURF_FR}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              source === SOURCES.TURF_FR
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  source === SOURCES.TURF_FR
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-gray-300'
                }`}
              >
                {source === SOURCES.TURF_FR && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">Turf-FR (HTML)</div>
                <div className="text-xs text-gray-500 mt-1">Scraping depuis turf-fr.com</div>
              </div>
            </div>
          </div>
        </label>
        <label className="flex-1 group cursor-pointer">
          <input
            type="radio"
            name="source"
            value={SOURCES.PMU_JSON}
            checked={source === SOURCES.PMU_JSON}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              source === SOURCES.PMU_JSON
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  source === SOURCES.PMU_JSON
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-gray-300'
                }`}
              >
                {source === SOURCES.PMU_JSON && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">PMU JSON</div>
                <div className="text-xs text-gray-500 mt-1">API PMU officielle</div>
              </div>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
