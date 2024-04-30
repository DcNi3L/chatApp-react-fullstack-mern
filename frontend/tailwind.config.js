/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,jsx}"
  ],
  theme: {
    extend: {
      backgroundImage: theme => ({
        'gradient-radial': 'radial-gradient(circle at 45% 15%, #1C1D20 50%, #333 100%)',
      }),
    },
  },
  plugins: [],
}

