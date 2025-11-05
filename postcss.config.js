// postcss.config.js
export default {
  plugins: {
    "@tailwindcss/postcss": {}, // 👈 new Tailwind PostCSS plugin
    autoprefixer: {}, // keep autoprefixer
  },
};
