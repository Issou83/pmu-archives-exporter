import { useEffect } from 'react';

/**
 * Composant Toast pour afficher des messages - Design moderne
 */
export function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      icon: '✅',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      icon: '❌',
    },
  };

  const style = styles[type] || styles.success;

  return (
    <div
      className={`fixed top-6 right-4 sm:right-6 z-50 animate-fade-in-up ${style.bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md border border-white/20 backdrop-blur-sm`}
      style={{ animation: 'fadeInUp 0.3s ease-out' }}
    >
      <span className="text-xl">{style.icon}</span>
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold text-xl leading-none transition-colors"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}
