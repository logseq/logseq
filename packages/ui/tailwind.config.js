const radix = require('@radix-ui/colors')

function mapRadixColorToTailwind(color) {
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

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './@/components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './examples/**/*.{ts,tsx}',
    '../../deps/shui/src/**/*.cljs'
  ],
  safelist: [
    { pattern: /primary-(gray|red|yellow|green|blue|orange|indigo|rose|purple|pink)/ }
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
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
        accent: {
          DEFAULT: 'var(--lx-gray-04, hsl(var(--accent)))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'var(--lx-gray-03, hsl(var(--popover)))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

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
        violet: mapRadixColorToTailwind('violet')
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
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
  corePlugins: {
    preflight: true,
  }
}