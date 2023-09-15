const colors = require('tailwindcss/colors')
const radix = require('@radix-ui/colors')

const lx = {
  'accent-01': 'var(--lx-accent-01)',
  'accent-02': 'var(--lx-accent-02)',
  'accent-03': 'var(--lx-accent-03)',
  'accent-04': 'var(--lx-accent-04)',
  'accent-05': 'var(--lx-accent-05)',
  'accent-06': 'var(--lx-accent-06)',
  'accent-07': 'var(--lx-accent-07)',
  'accent-08': 'var(--lx-accent-08)',
  'accent-09': 'var(--lx-accent-09)',
  'accent-10': 'var(--lx-accent-10)',
  'accent-11': 'var(--lx-accent-11)',
  'accent-12': 'var(--lx-accent-12)',
  'accent-01-alpha': 'var(--lx-accent-01-alpha)',
  'accent-02-alpha': 'var(--lx-accent-02-alpha)',
  'accent-03-alpha': 'var(--lx-accent-03-alpha)',
  'accent-04-alpha': 'var(--lx-accent-04-alpha)',
  'accent-05-alpha': 'var(--lx-accent-05-alpha)',
  'accent-06-alpha': 'var(--lx-accent-06-alpha)',
  'accent-07-alpha': 'var(--lx-accent-07-alpha)',
  'accent-08-alpha': 'var(--lx-accent-08-alpha)',
  'accent-09-alpha': 'var(--lx-accent-09-alpha)',
  'accent-10-alpha': 'var(--lx-accent-10-alpha)',
  'accent-11-alpha': 'var(--lx-accent-11-alpha)',
  'accent-12-alpha': 'var(--lx-accent-12-alpha)',
  'gray-01': 'var(--lx-gray-01)',
  'gray-02': 'var(--lx-gray-02)',
  'gray-03': 'var(--lx-gray-03)',
  'gray-04': 'var(--lx-gray-04)',
  'gray-05': 'var(--lx-gray-05)',
  'gray-06': 'var(--lx-gray-06)',
  'gray-07': 'var(--lx-gray-07)',
  'gray-08': 'var(--lx-gray-08)',
  'gray-09': 'var(--lx-gray-09)',
  'gray-10': 'var(--lx-gray-10)',
  'gray-11': 'var(--lx-gray-11)',
  'gray-12': 'var(--lx-gray-12)',
  'gray-01-alpha': 'var(--lx-gray-01-alpha)',
  'gray-02-alpha': 'var(--lx-gray-02-alpha)',
  'gray-03-alpha': 'var(--lx-gray-03-alpha)',
  'gray-04-alpha': 'var(--lx-gray-04-alpha)',
  'gray-05-alpha': 'var(--lx-gray-05-alpha)',
  'gray-06-alpha': 'var(--lx-gray-06-alpha)',
  'gray-07-alpha': 'var(--lx-gray-07-alpha)',
  'gray-08-alpha': 'var(--lx-gray-08-alpha)',
  'gray-09-alpha': 'var(--lx-gray-09-alpha)',
  'gray-10-alpha': 'var(--lx-gray-10-alpha)',
  'gray-11-alpha': 'var(--lx-gray-11-alpha)',
  'gray-12-alpha': 'var(--lx-gray-12-alpha)',
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
  ],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    require('tailwind-capitalize-first-letter'),
    exposeColorsToCssVars
  ],
  theme: {
    extend: {
      backgroundColor: {
        ...lx,
      },
      borderColor: {
        ...lx,
      },
      outlineColor: {
        ...lx,
      },
      textColor: {
        ...lx,
      },
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
      gray: colors.gray,
      red: colors.red,
      green: colors.green,
      blue: colors.blue,
      black: colors.black,
      orange: colors.orange,
      indigo: colors.indigo,
      rose: colors.rose,
      purple: colors.purple,
      pink: colors.pink,
      yellow: colors.yellow,

      current: 'currentColor',
      transparent: 'transparent',
      white: colors.white,

      // Radix colors
      // amber: buildColor("amber"),
      // blue: buildColor("blue"),
      // bronze: buildColor("bronze"),
      // brown: buildColor("brown"),
      // crimson: buildColor("crimson"),
      // cyan: buildColor("cyan"),
      // gold: buildColor("gold"),
      // grass: buildColor("grass"),
      // green: buildColor("green"),
      // lime: buildColor("lime"),
      // mauve: buildColor("mauve"),
      // mint: buildColor("mint"),
      // olive: buildColor("olive"),
      // orange: buildColor("orange"),
      // pink: buildColor("pink"),
      // plum: buildColor("plum"),
      // purple: buildColor("purple"),
      // red: buildColor("red"),
      // sage: buildColor("sage"),
      // sand: buildColor("sand"),
      // sky: buildColor("sky"),
      // slate: buildColor("slate"),
      // teal: buildColor("teal"),
      // tomato: buildColor("tomato"),
      // violet: buildColor("violet"),
        
      // Custom colors
      // gray: buildColor("gray", colors.neutral),
      // yellow: buildColor("yellow", colors.amber),
      // indigo: buildColor("indigo", {
      //   50: '#f0f9ff',
      //   100: '#e0f2fe',
      //   200: '#bae6fd',
      //   300: '#7dd3fc',
      //   400: '#38bdf8',
      //   500: '#0ea5e9',
      //   600: '#0284c7',
      //   700: '#005b8a',
      //   800: '#075985',
      //   900: '#0c4a6e',
      // }),

      // tomatodark: buildColor("tomatoDark"),
      // reddark: buildColor("redDark"),
      // crimsondark: buildColor("crimsonDark"),
      // pinkdark: buildColor("pinkDark"),
      // plumdark: buildColor("plumDark"),
      // purpledark: buildColor("purpleDark"),
      // violetdark: buildColor("violetDark"),
      // skydark: buildColor("skyDark"),
      // indigodark: buildColor("indigoDark"),
      // bluedark: buildColor("blueDark"),
      // cyandark: buildColor("cyanDark"),
      // mintdark: buildColor("mintDark"),
      // tealdark: buildColor("tealDark"),
      // greendark: buildColor("greenDark"),
      // limedark: buildColor("limeDark"),
      // grassdark: buildColor("grassDark"),
      // yellowdark: buildColor("yellowDark"),
      // amberdark: buildColor("amberDark"),
      // orangedark: buildColor("orangeDark"),
      // browndark: buildColor("brownDark"),
      // graydark: buildColor("grayDark"),
      // mauvedark: buildColor("mauveDark"),
      // slatedark: buildColor("slateDark"),
      // sagedark: buildColor("sageDark"),
      // olivedark: buildColor("oliveDark"),
      // sanddark: buildColor("sandDark"),
      // golddark: buildColor("goldDark"),
      // bronzedark: buildColor("bronzeDark"),
    }
  }
}
