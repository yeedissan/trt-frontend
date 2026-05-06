/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        trt: {
          900: '#1e1b4b',
          700: '#3730a3',
          500: '#4338ca',
          300: '#6366f1',
          100: '#ede9fe',
          50:  '#f5f3ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  safelist: [
    'bg-white/5',
    'bg-white/8',
    'bg-white/10',
    'bg-white/12',
    'bg-white/15',
    'hover:bg-white/5',
    'hover:bg-white/8',
    'even:bg-gray-50',
  ],
  plugins: [],
}
