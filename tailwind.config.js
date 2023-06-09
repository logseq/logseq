const plugin = require('tailwindcss/plugin')
const colors = require('tailwindcss/colors')
const radix = require('@radix-ui/colors')

const gradientColors = {
  tomato:  ["amber",     "orange",    "tomato",      "red",         "crimson"],
  red:     ["orange",    "tomato",    "red",         "crimson",     "pink"], 
  crimson: ["tomato",    "red",       "crimson",     "pink",        "plum"],
  pink:    ["red",       "crimson",   "pink",        "plum",        "purple"],
  plum:    ["crimson",   "pink",      "plum",        "purple",      "violet"], 
  purple:  ["pink",      "plum",      "purple",      "violet",      "indigo"],
  violet:  ["plum",      "purple",    "violet",      "indigo",      "blue"],  
  indigo:  ["purple",    "violet",    "indigo",      "blue",        "cyan"],
  blue:    ["violet",    "indigo",    "blue",        "cyan",        "teal"],
  // sky:     ["indigo",    "blue",      "sky",         "cyan",        "teal"],
  cyan:    ["indigo",    "blue",      "cyan",        "teal",        "green"],
  teal:    ["blue",      "cyan",      "teal",        "green",       "grass"],
  // mint:    ["cyan",      "teal",      "mint",        "green",       "grass"],
  green:   ["cyan",      "teal",      "green",       "grass",       "amber"],
  grass:   ["teal",      "green",     "grass",       "amber",       "orange"],
  // lime:    ["green",     "grass",     "lime",        "yellow",      "amber"],
  // yellow:  ["grass",     "lime",      "yellow",      "amber",       "orange"],
  amber:   ["green",     "grass",     "amber",       "orange",      "tomato"],
  orange:  ["grass",     "amber",     "orange",      "tomato",      "red"],
  // brown:   ["green",     "grass",     "brown",       "tomato",       "red"],
}

function exposeColorsToCssVars ({ addBase, theme }) {
  function extractColorVars (colorObj, colorGroup = '') {
    return Object.keys(colorObj).reduce((vars, colorKey) => {
      const value = colorObj[colorKey]

      const newVars =
        typeof value === 'string'
          ? { [`--color${colorGroup}-${colorKey}`]: value }
          : extractColorVars(value, `-${colorKey}`)

      return { ...vars, ...newVars }
    }, {})
  }

  addBase({
    ':root': extractColorVars(theme('colors')),
  })
}

function buildColor(color, custom) {
  const base = custom || colors[color] || {}

  for (const [xName, xValue] of Object.entries(radix[color] || {})) {
    const regexResult = xName.match(/\d+$/) 
    if (!regexResult) { continue; } 
    const xStep = regexResult[0]
    base[xStep] = xValue
  }

  return base
}

// this will allow us to use gradient color functions in the ui:
// grad-bg-tomato-3 OR grad-bg-tomato-3-alpha
// it will also loop through all 5 color stops, unless the stops are specified 
// grad-bg-stops-3
// this will have a default repeating gradient at a step that can be configured with 
// grad-bg-cycle-32 
const addGradientColors = plugin(({ addBase, addComponents, addUtilities, config, ___theme }) => {
  const dark = getDarkSelector(config)

  addUtilities({
    ['.grad-bg-stops-3']: {
      '--grad-bg-stops': "var(--grad-bg-stop-b), var(--grad-bg-stop-c), var(--grad-bg-stop-d)",
    },
    ['.grad-bg-stops-5']: {
      '--grad-bg-stops': "var(--grad-bg-stop-a), var(--grad-bg-stop-b), var(--grad-bg-stop-c), var(--grad-bg-stop-d), var(--grad-bg-stop-e)",
    },
    ['.grad-bg-cycle-12']: {
      'background-image': 'repeatint-linear-gradient(to right, var(--grad-bg-stops))',
    },
  })

  Object.values(gradientColors).forEach((stops, ___index) => {
    const baseColor = stops[2]
    const color = (scale, stopIndex = 2, suffix = "") => `--color-${stops[stopIndex]}${suffix}-${scale}`

    addComponents({
      // tailwind componnent for .grad-bg-COLOR-9
      [`.grad-bg-${baseColor}-9`]: {
        "--grad-bg-stop-a": `var(${color(9, 0)})`,
        "--grad-bg-stop-b": `var(${color(9, 1)})`,
        "--grad-bg-stop-c": `var(${color(9, 2)})`,
        "--grad-bg-stop-d": `var(${color(9, 3)})`,
        "--grad-bg-stop-e": `var(${color(9, 4)})`,
        "--grad-bg-stops-default": `var(--grad-bg-stop-b), var(--grad-bg-stop-c), var(--grad-bg-stop-d)`,
        "background-image": `linear-gradient(var(--grad-bg-direction, to right), var(--grad-bg-stops, var(--grad-bg-stops-default)))`,

        [dark]: {
          "--grad-bg-stop-a": `var(${color(9, 0, "dark")})`,
          "--grad-bg-stop-b": `var(${color(9, 1, "dark")})`,
          "--grad-bg-stop-c": `var(${color(9, 2, "dark")})`,
          "--grad-bg-stop-d": `var(${color(9, 3, "dark")})`,
          "--grad-bg-stop-e": `var(${color(9, 4, "dark")})`,
        }
      },
      // tailwind component for .grad-bg-COLOR-9-alpha
      [`.grad-bg-${baseColor}-9-alpha`]: {
        "--grad-bg-stop-a": `var(${color(9, 0)})`,
        "--grad-bg-stop-b": `var(${color(9, 1)})`,
        "--grad-bg-stop-c": `var(${color(9, 2)})`,
        "--grad-bg-stop-d": `var(${color(9, 3)})`,
        "--grad-bg-stop-e": `var(${color(9, 4)})`,
        "--grad-bg-stops-default": `var(--grad-bg-stop-b), var(--grad-bg-stop-c), var(--grad-bg-stop-d)`,
        "background-image": `linear-gradient(var(--grad-bg-direction, to right), var(--grad-bg-stops, var(--grad-bg-stops-default)))`,

        [dark]: {
          "--grad-bg-stop-a": `var(${color(9, 0, "dark")})`,
          "--grad-bg-stop-b": `var(${color(9, 1, "dark")})`,
          "--grad-bg-stop-c": `var(${color(9, 2, "dark")})`,
          "--grad-bg-stop-d": `var(${color(9, 3, "dark")})`,
          "--grad-bg-stop-e": `var(${color(9, 4, "dark")})`,
        }
      },
    })
  })
})

function getDarkSelector(config) {
  const darkMode = config("darkMode");
  const prefix = config("prefix");

  if (Array.isArray(darkMode)) {
    if (darkMode.length < 2) {
      throw new Error(
        "To customize the dark mode selector, `darkMode` should contain two items. Documentation: https://tailwindcss.com/docs/dark-mode#customizing-the-class-name"
      );
    }

    if (darkMode[0] !== "class") {
      throw new Error(
        'To customize the dark mode selector, `darkMode` should have "class" as its first item. Documentation: https://tailwindcss.com/docs/dark-mode#customizing-the-class-name'
      );
    }

    return darkMode[1] + " &";
  }

  if (darkMode === "media") {
    return "@media (prefers-color-scheme: dark)";
  }

  if (darkMode !== "class") {
    throw new Error(
      "Invalid `darkMode`. Documentation: https://tailwindcss.com/docs/dark-mode"
    );
  }

  if (prefix) {
    return `[class~="${prefix}dark"] &`;
  }

  return '[class~="dark"] &';
}

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.js',
    './src/**/*.cljs',
    './resources/**/*.html',
    './deps/shui/src/**/*.cljs',
  ],
  safelist: [
    'bg-black', 'bg-white', 'capitalize-first',
    { pattern: /bg-(gray|red|yellow|green|blue|orange|indigo|rose|purple|pink)-(100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-(gray|red|yellow|green|blue|orange|indigo|rose|purple|pink)-(100|200|300|400|500|600|700|800|900)/ },
    { pattern: /columns-([1-9]|1[0-2])|(auto|3xs|2xs|xs|sm|md|lg|xl)|([2-7]xl)/ },
    { pattern: /bg-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /shadow-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /text-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /ring-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /from-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /via-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /to-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /border-(mauve|slate|sage|olive|sand|tomato|red|crimson|pink|plum|purple|violet|indigo|blue|sky|cyan|teal|mint|green|grass|lime|yellow|amber|orange|brown)(dark)?-(4|5|6|7|8)/ },
  ],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    require('tailwind-capitalize-first-letter'),
    addGradientColors,
    exposeColorsToCssVars
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'gradient-conic-bounce': 'conic-gradient(var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to), var(--tw-gradient-via), var(--tw-gradient-from))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      fontSize: {
        '2xs': ['0.625rem', '0.875rem']
      },
      animation: {
        'spin-reverse': 'spin 2s linear infinite reverse',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem'
      },
      scale: {
        '200': '2',
        '250': '2.5',
        '300': '3',
        '400': '4',
      },
      width: {
        'lsm': '600px',
        'lmd': '728px',
        'llg': '960px'
      }
    },
    colors: {
      // Tailwind colors
      black: colors.black,
      current: 'currentColor',
      rose: colors.rose,
      transparent: 'transparent',
      white: colors.white,

      // Radix colors
      amber: buildColor("amber"),
      blue: buildColor("blue"),
      bronze: buildColor("bronze"),
      brown: buildColor("brown"),
      crimson: buildColor("crimson"),
      cyan: buildColor("cyan"),
      gold: buildColor("gold"),
      grass: buildColor("grass"),
      green: buildColor("green"),
      lime: buildColor("lime"),
      mauve: buildColor("mauve"),
      mint: buildColor("mint"),
      olive: buildColor("olive"),
      orange: buildColor("orange"),
      pink: buildColor("pink"),
      plum: buildColor("plum"),
      purple: buildColor("purple"),
      red: buildColor("red"),
      sage: buildColor("sage"),
      sand: buildColor("sand"),
      sky: buildColor("sky"),
      slate: buildColor("slate"),
      teal: buildColor("teal"),
      tomato: buildColor("tomato"),
      violet: buildColor("violet"),
        
      // Custom colors
      gray: buildColor("gray", colors.neutral),
      yellow: buildColor("yellow", colors.amber),
      indigo: buildColor("indigo", {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#005b8a',
        800: '#075985',
        900: '#0c4a6e',
      }),

      tomatodark: buildColor("tomatoDark"),
      reddark: buildColor("redDark"),
      crimsondark: buildColor("crimsonDark"),
      pinkdark: buildColor("pinkDark"),
      plumdark: buildColor("plumDark"),
      purpledark: buildColor("purpleDark"),
      violetdark: buildColor("violetDark"),
      skydark: buildColor("skyDark"),
      indigodark: buildColor("indigoDark"),
      bluedark: buildColor("blueDark"),
      cyandark: buildColor("cyanDark"),
      mintdark: buildColor("mintDark"),
      tealdark: buildColor("tealDark"),
      greendark: buildColor("greenDark"),
      limedark: buildColor("limeDark"),
      grassdark: buildColor("grassDark"),
      yellowdark: buildColor("yellowDark"),
      amberdark: buildColor("amberDark"),
      orangedark: buildColor("orangeDark"),
      browndark: buildColor("brownDark"),
      graydark: buildColor("grayDark"),
      mauvedark: buildColor("mauveDark"),
      slatedark: buildColor("slateDark"),
      sagedark: buildColor("sageDark"),
      olivedark: buildColor("oliveDark"),
      sanddark: buildColor("sandDark"),
      golddark: buildColor("goldDark"),
      bronzedark: buildColor("bronzeDark"),
    }
  }
}
