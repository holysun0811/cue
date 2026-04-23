/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cue: {
          black: '#000000',
          space: '#09090B',
          panel: '#18181B',
          accent: '#EF4C2F',
          accentSoft: '#FF8A5B',
          accentDeep: '#C6531A',
          accentMuted: '#F6A55E',
          cream: '#FBF4EA'
        }
      },
      boxShadow: {
        phone: '0 34px 110px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 72px rgba(239, 106, 31, 0.16)',
        accent: '0 0 24px rgba(239, 76, 47, 0.3), 0 0 56px rgba(239, 106, 31, 0.18)',
        accentLg: '0 18px 54px rgba(239, 76, 47, 0.28)'
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
