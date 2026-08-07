/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0D0F',
        surface: '#14171A',
        surface2: '#1B1F23',
        volt: '#C6FF3D',
        pulse: '#FF4D4D',
        mist: '#8B9198',
        chalk: '#F5F6F7',
      },
      fontFamily: {
        display: ['"Archivo Black"', 'Impact', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.4)' },
        },
        drawline: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        heartbeat: 'heartbeat 1.4s ease-in-out infinite',
        drawline: 'drawline 2.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
