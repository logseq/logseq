module.exports = (ctx) => ({
  plugins: [
    require("autoprefixer"),
    require("tailwindcss")("tailwind.config.js"),
    ctx.env === "production" ? require("cssnano")({ preset: "default" }) : null,
    ctx.env === "production"
      ? require("@fullhuman/postcss-purgecss")({
        content: [
          './src/**/*.js',
          './src/**/*.cljs',
          './resources/**/*.html',
        ],

        // https://tailwindcss.com/docs/controlling-file-size#understanding-the-regex
        // without this we miss keeping eg. `w-1/2`
        defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
      })
      : null,
  ],
});
