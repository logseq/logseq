const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')
const radix = require('@radix-ui/colors')

const accent = {
  'DEFAULT': 'hsl(var(--accent))',
  'base': 'hsl(var(--accent))',
  'foreground': 'hsl(var(--accent-foreground))',
  '01': 'var(--lx-accent-01, --rx-gray-01)',
  '02': 'var(--lx-accent-02, hsl(var(--accent)/.1))',
  '03': 'var(--lx-accent-03, hsl(var(--accent)/.15))',
  '04': 'var(--lx-accent-04, hsl(var(--accent)/.2))',
  '05': 'var(--lx-accent-05, hsl(var(--accent)/.3))',
  '06': 'var(--lx-accent-06, hsl(var(--accent)/.4))',
  '07': 'var(--lx-accent-07, hsl(var(--accent)/.5))',
  '08': 'var(--lx-accent-08, hsl(var(--accent)/.6))',
  '09': 'var(--lx-accent-09, hsl(var(--accent)/.7))',
  '10': 'var(--lx-accent-10, hsl(var(--accent)/.8))',
  '11': 'var(--lx-accent-11, hsl(var(--accent)/.9))',
  '12': 'var(--lx-accent-12, --rx-gray-12)',
  '01-alpha': 'var(--lx-accent-01-alpha)',
  '02-alpha': 'var(--lx-accent-02-alpha)',
  '03-alpha': 'var(--lx-accent-03-alpha)',
  '04-alpha': 'var(--lx-accent-04-alpha)',
  '05-alpha': 'var(--lx-accent-05-alpha)',
  '06-alpha': 'var(--lx-accent-06-alpha)',
  '07-alpha': 'var(--lx-accent-07-alpha)',
  '08-alpha': 'var(--lx-accent-08-alpha)',
  '09-alpha': 'var(--lx-accent-09-alpha)',
  '10-alpha': 'var(--lx-accent-10-alpha)',
  '11-alpha': 'var(--lx-accent-11-alpha)',
  '12-alpha': 'var(--lx-accent-12-alpha)',
}

const gray = {
  ...colors.gray,
  '01': 'var(--lx-gray-01, var(--ls-primary-background-color, var(--rx-gray-01)))',
  '02': 'var(--lx-gray-02, var(--ls-secondary-background-color, var(--rx-gray-02)))',
  '03': 'var(--lx-gray-03, var(--ls-tertiary-background-color, var(--rx-gray-03)))',
  '04': 'var(--lx-gray-04, var(--ls-quaternary-background-color, var(--rx-gray-04)))',
  '05': 'var(--lx-gray-05, var(--rx-gray-05))',
  '06': 'var(--lx-gray-06, var(--rx-gray-06))',
  '07': 'var(--lx-gray-07, var(--rx-gray-07))',
  '08': 'var(--lx-gray-08, var(--rx-gray-08))',
  '09': 'var(--lx-gray-09, var(--rx-gray-09))',
  '10': 'var(--lx-gray-10, var(--rx-gray-10))',
  '11': 'var(--lx-gray-11, var(--rx-gray-11))',
  '12': 'var(--lx-gray-12, var(--rx-gray-12))',
  '01-alpha': 'var(--lx-gray-01-alpha, var(--rx-gray-01-alpha))',
  '02-alpha': 'var(--lx-gray-02-alpha, var(--rx-gray-02-alpha))',
  '03-alpha': 'var(--lx-gray-03-alpha, var(--rx-gray-03-alpha))',
  '04-alpha': 'var(--lx-gray-04-alpha, var(--rx-gray-04-alpha))',
  '05-alpha': 'var(--lx-gray-05-alpha, var(--rx-gray-05-alpha))',
  '06-alpha': 'var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))',
  '07-alpha': 'var(--lx-gray-07-alpha, var(--rx-gray-07-alpha))',
  '08-alpha': 'var(--lx-gray-08-alpha, var(--rx-gray-08-alpha))',
  '09-alpha': 'var(--lx-gray-09-alpha, var(--rx-gray-09-alpha))',
  '10-alpha': 'var(--lx-gray-10-alpha, var(--rx-gray-10-alpha))',
  '11-alpha': 'var(--lx-gray-11-alpha, var(--rx-gray-11-alpha))',
  '12-alpha': 'var(--lx-gray-12-alpha, var(--rx-gray-12-alpha))',
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

const withOverride = plugin(function ({ matchUtilities }) {
  matchUtilities({
    'or': (value, b) => {
      // check if the value starts with "bg-"
      if (value.startsWith('bg-')) {
        return { [`--lx-bg-override`]: `var(--lx-${value})` }
      }
      // check if the value starts with "text-"
      if (value.startsWith('text-')) {
        return { [`--lx-text-override`]: `var(--lx-${value})` }
      }
      // check if the value starts with "border-"
      if (value.startsWith('border-')) {
        return { [`--lx-border-override`]: `var(--lx-${value})` }
      }
    }
  }, {
    values: {}
  })
})

function mapRadixColorToTailwind (color) {
  const radixColor = radix[color]
  if (!radixColor) throw new Error(`[radix color] not exist for ${color}`)
  const twSteps = [10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  const rxSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const colors = {}

  twSteps.forEach((twStep, index) => {
    const rxStep = rxSteps[index]
    // base color
    colors[twStep] = radixColor[`${color}${rxStep}`]
    // theme vars color
    const rxStepName = `${(rxStep < 10) ? '0' : ''}${rxStep}`
    const rxVarName = `--rx-${color}-${rxStepName}`
    colors[`rx-${rxStepName}`] = `var(${rxVarName})`
    colors[`rx-${rxStepName}-alpha`] = `var(${rxVarName}-alpha)`
  })

  return colors
}

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.js',
    './src/**/*.cljs',
    './resources/**/*.html',
    './deps/shui/src/**/*.cljs',
    './packages/ui/@/components/**/*.{ts,tsx}'
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
    require('tailwind-capitalize-first-letter'),
    require('tailwindcss-animate'),
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
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
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
      },
      // backgroundColor: {
      //   ...lx('--lx-bg-override'),
      // },
      // textColor: {
      //   ...lx('--lx-text-override'),
      // },
      // borderColor: {
      //   ...lx('--lx-border-override'),
      // },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
    },
    colors: {
      // Theme basic
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      popovelx: {
        DEFAULT: 'var(--lx-gray-03, hsl(var(--popover)))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },

      // Tailwind colors
      gray: gray,
      accent: accent,
      current: 'currentColor',
      transparent: 'transparent',
      black: colors.black,
      white: colors.white,

      red: mapRadixColorToTailwind('red'),
      pink: mapRadixColorToTailwind('pink'),
      orange: mapRadixColorToTailwind('orange'),
      yellow: mapRadixColorToTailwind('yellow'),
      green: mapRadixColorToTailwind('green'),
      blue: mapRadixColorToTailwind('blue'),
      indigo: mapRadixColorToTailwind('indigo'),
      purple: mapRadixColorToTailwind('purple'),

      rose: mapRadixColorToTailwind('red'),
      amber: mapRadixColorToTailwind('amber'),
      bronze: mapRadixColorToTailwind('bronze'),
      brown: mapRadixColorToTailwind('brown'),
      crimson: mapRadixColorToTailwind('crimson'),
      cyan: mapRadixColorToTailwind('cyan'),
      gold: mapRadixColorToTailwind('gold'),
      grass: mapRadixColorToTailwind('grass'),
      lime: mapRadixColorToTailwind('lime'),
      mauve: mapRadixColorToTailwind('mauve'),
      mint: mapRadixColorToTailwind('mint'),
      olive: mapRadixColorToTailwind('olive'),
      plum: mapRadixColorToTailwind('plum'),
      sage: mapRadixColorToTailwind('sage'),
      sand: mapRadixColorToTailwind('sand'),
      sky: mapRadixColorToTailwind('sky'),
      slate: mapRadixColorToTailwind('slate'),
      teal: mapRadixColorToTailwind('teal'),
      tomato: mapRadixColorToTailwind('tomato'),
      violet: mapRadixColorToTailwind('violet'),
    }
  },
  corePlugins: {
    preflight: true
  }
}
