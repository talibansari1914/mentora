/** @type {import('tailwindcss').Config} */
module.exports = {
  // Wired up via @config in src/app/globals.css so the `saffron` color
  // below (and any future theme extensions) actually take effect under
  // Tailwind v4, which otherwise ignores this file entirely.
  //
  // A single glob covering all of src/ — not just pages/components/app —
  // so utility classes used anywhere under src/features, src/lib, etc.
  // (e.g. animate-pulse/animate-spin in the video-to-notes and
  // text-to-audio features) keep being picked up, matching what Tailwind
  // was already scanning by default before this file was wired in.
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        saffron: "#F59E0B",
      },
    },
  },
  plugins: [],
};