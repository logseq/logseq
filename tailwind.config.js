const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')
const radix = require('@radix-ui/colors')

const lx = override => ({
  'accent-01': 'or(' + override + ', --lx-accent-01, --ls-page-properties-background-color)',
  'accent-02': 'or(' + override + ', --lx-accent-02, --ls-page-properties-background-color)',
  'accent-03': 'or(' + override + ', --lx-accent-03, --ls-page-properties-background-color)',
  'accent-04': 'or(' + override + ', --lx-accent-04, --ls-page-properties-background-color)',
  'accent-05': 'or(' + override + ', --lx-accent-05, --color-blue-900)',
  'accent-06': 'or(' + override + ', --lx-accent-06, --color-blue-800)',
  'accent-07': 'or(' + override + ', --lx-accent-07, --color-blue-700)',
  'accent-08': 'or(' + override + ', --lx-accent-08, --color-blue-600)',
  'accent-09': 'or(' + override + ', --lx-accent-09, --color-blue-500)',
  'accent-10': 'or(' + override + ', --lx-accent-10, --color-blue-400)',
  'accent-11': 'or(' + override + ', --lx-accent-11, --color-blue-200)',
  'accent-12': 'or(' + override + ', --lx-accent-12, --color-blue-50)',
  'accent-01-alpha': 'or(' + override + ', --lx-accent-01-alpha, --ls-page-properties-background-color)',
  'accent-02-alpha': 'or(' + override + ', --lx-accent-02-alpha, --ls-page-properties-background-color)',
  'accent-03-alpha': 'or(' + override + ', --lx-accent-03-alpha, --ls-page-properties-background-color)',
  'accent-04-alpha': 'or(' + override + ', --lx-accent-04-alpha, --ls-page-properties-background-color)',
  'accent-05-alpha': 'or(' + override + ', --lx-accent-05-alpha, --color-blue-900)',
  'accent-06-alpha': 'or(' + override + ', --lx-accent-06-alpha, --color-blue-800)',
  'accent-07-alpha': 'or(' + override + ', --lx-accent-07-alpha, --color-blue-700)',
  'accent-08-alpha': 'or(' + override + ', --lx-accent-08-alpha, --color-blue-600)',
  'accent-09-alpha': 'or(' + override + ', --lx-accent-09-alpha, --color-blue-500)',
  'accent-10-alpha': 'or(' + override + ', --lx-accent-10-alpha, --color-blue-400)',
  'accent-11-alpha': 'or(' + override + ', --lx-accent-11-alpha, --color-blue-200)',
  'accent-12-alpha': 'or(' + override + ', --lx-accent-12-alpha, --color-blue-50)',
  'gray-01': 'or(' + override + ', --lx-gray-01, --ls-primary-background-color)',
  'gray-02': 'or(' + override + ', --lx-gray-02, --ls-secondary-background-color)',
  'gray-03': 'or(' + override + ', --lx-gray-03, --ls-tertiary-background-color)',
  'gray-04': 'or(' + override + ', --lx-gray-04, --ls-quaternary-background-color)',
  'gray-05': 'or(' + override + ', --lx-gray-05, --color-level-4)',
  'gray-06': 'or(' + override + ', --lx-gray-06, --ls-block-bullet-border-color)',
  'gray-07': 'or(' + override + ', --lx-gray-07, --ls-border-color)',
  'gray-08': 'or(' + override + ', --lx-gray-08, --ls-secondary-border-color)',
  'gray-09': 'or(' + override + ', --lx-gray-09, --color-level-5)',
  'gray-10': 'or(' + override + ', --lx-gray-10, --ls-title-text-color)',
  'gray-11': 'or(' + override + ', --lx-gray-11, --ls-primary-text-color)',
  'gray-12': 'or(' + override + ', --lx-gray-12, --ls-secondary-text-color)',
  'gray-01-alpha': 'or(' + override + ', --lx-gray-01-alpha, --ls-primary-background-color)',
  'gray-02-alpha': 'or(' + override + ', --lx-gray-02-alpha, --ls-secondary-background-color)',
  'gray-03-alpha': 'or(' + override + ', --lx-gray-03-alpha, --ls-tertiary-background-color)',
  'gray-04-alpha': 'or(' + override + ', --lx-gray-04-alpha, --ls-quaternary-background-color)',
  'gray-05-alpha': 'or(' + override + ', --lx-gray-05-alpha, --color-level-4)',
  'gray-06-alpha': 'or(' + override + ', --lx-gray-06-alpha, --ls-block-bullet-color)',
  'gray-07-alpha': 'or(' + override + ', --lx-gray-07-alpha, --ls-border-color)',
  'gray-08-alpha': 'or(' + override + ', --lx-gray-08-alpha, --ls-secondary-border-color)',
  'gray-09-alpha': 'or(' + override + ', --lx-gray-09-alpha, --color-level-5)',
  'gray-10-alpha': 'or(' + override + ', --lx-gray-10-alpha, --color-level-6)',
  'gray-11-alpha': 'or(' + override + ', --lx-gray-11-alpha, --ls-primary-text-color)',
  'gray-12-alpha': 'or(' + override + ', --lx-gray-12-alpha, --ls-secondary-text-color)',
})

const accent = {
  'DEFAULT': 'hsl(var(--accent))',
  'base': 'hsl(var(--accent))',
  'foreground': 'hsl(var(--accent-foreground))',
  '01': 'var(--lx-accent-01)',
  '02': 'var(--lx-accent-02)',
  '03': 'var(--lx-accent-03)',
  '04': 'var(--lx-accent-04)',
  '05': 'var(--lx-accent-05)',
  '06': 'var(--lx-accent-06)',
  '07': 'var(--lx-accent-07)',
  '08': 'var(--lx-accent-08)',
  '09': 'var(--lx-accent-09)',
  '10': 'var(--lx-accent-10)',
  '11': 'var(--lx-accent-11)',
  '12': 'var(--lx-accent-12)',
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
  '01': 'var(--lx-gray-01)',
  '02': 'var(--lx-gray-02)',
  '03': 'var(--lx-gray-03)',
  '04': 'var(--lx-gray-04)',
  '05': 'var(--lx-gray-05)',
  '06': 'var(--lx-gray-06)',
  '07': 'var(--lx-gray-07)',
  '08': 'var(--lx-gray-08)',
  '09': 'var(--lx-gray-09)',
  '10': 'var(--lx-gray-10)',
  '11': 'var(--lx-gray-11)',
  '12': 'var(--lx-gray-12)',
  '01-alpha': 'var(--lx-gray-01-alpha)',
  '02-alpha': 'var(--lx-gray-02-alpha)',
  '03-alpha': 'var(--lx-gray-03-alpha)',
  '04-alpha': 'var(--lx-gray-04-alpha)',
  '05-alpha': 'var(--lx-gray-05-alpha)',
  '06-alpha': 'var(--lx-gray-06-alpha)',
  '07-alpha': 'var(--lx-gray-07-alpha)',
  '08-alpha': 'var(--lx-gray-08-alpha)',
  '09-alpha': 'var(--lx-gray-09-alpha)',
  '10-alpha': 'var(--lx-gray-10-alpha)',
  '11-alpha': 'var(--lx-gray-11-alpha)',
  '12-alpha': 'var(--lx-gray-12-alpha)',
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
    exposeColorsToCssVars,
    withOverride,
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
      backgroundColor: {
        ...lx('--lx-bg-override'),
      },
      textColor: {
        ...lx('--lx-text-override'),
      },
      borderColor: {
        ...lx('--lx-border-override'),
      },
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
