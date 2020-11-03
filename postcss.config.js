module.exports = (ctx) => ({
  plugins: [
    require("autoprefixer"),
    require("tailwindcss")("tailwind.config.js"),
    ctx.env === "production" ? require("cssnano")({ preset: "default" }) : null,
  ],
});
