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
          purple: '#9D4EDD',
          green: '#22FF88',
          cyan: '#00F0FF',
          pink: '#FF2D95'
        }
      },
      boxShadow: {
        phone: '0 34px 110px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 72px rgba(157, 78, 221, 0.18)',
        neon: '0 0 24px rgba(0, 240, 255, 0.3), 0 0 56px rgba(157, 78, 221, 0.18)',
        purple: '0 18px 54px rgba(157, 78, 221, 0.28)'
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
