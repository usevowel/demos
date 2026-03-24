/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cisco-blue': 'var(--color-cisco-blue)',
        'cisco-blue-dark': 'var(--color-cisco-blue-dark)',
        'cisco-blue-light': 'var(--color-cisco-blue-light)',
        'cisco-teal': 'var(--color-cisco-teal)',
        'status-online': 'var(--color-status-online)',
        'status-warning': 'var(--color-status-warning)',
        'status-critical': 'var(--color-status-critical)',
        'status-info': 'var(--color-status-info)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'border': 'var(--color-border)',
      },
    },
  },
  plugins: [],
}
