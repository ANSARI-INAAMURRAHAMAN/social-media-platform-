/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'instagram-blue': '#1877f2',
        'instagram-gray': '#fafafa',
        'instagram-dark': '#262626',
      },
    },
  },
  plugins: [],
}
