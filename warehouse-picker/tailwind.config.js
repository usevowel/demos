/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'ocr-a': ['OCR-A', 'OCRA', 'OCR A Std', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
