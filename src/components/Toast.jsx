import { useEffect } from 'react';

/**
 * Composant Toast pour afficher des messages de succès/erreur
 */
export function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}

