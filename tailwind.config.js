/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Montserrat', 'Outfit', 'sans-serif'],
        body: ['Montserrat', 'Inter', 'sans-serif'],
        script: ['"Mister Grape"', 'cursive'],
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif']
      },
      colors: {
        brand: {
          DEFAULT: '#115C6B',
          hover: '#0D4955',
          light: '#1A7A8C',
          subtle: '#EDF7F9',
        },
        coral: {
          DEFAULT: '#F37561',
          hover: '#E05D47',
          light: '#FCE8E5',
        },
        forest: {
          DEFAULT: '#2A5841',
          hover: '#204432',
          light: '#EAF2ED',
        },
        blush: {
          DEFAULT: '#F5BABA',
          hover: '#EE9F9F',
          light: '#FDF3F3',
        },
        aqua: {
          DEFAULT: '#89D2DA',
          hover: '#68C3CE',
          light: '#E8F7F9',
        },
        lavva: {
          teal: '#115C6B',
          forest: '#2A5841',
          coral: '#F37561',
          blush: '#F5BABA',
          aqua: '#89D2DA',
          dark: '#0C181B',
        },
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        card: {
          DEFAULT: 'var(--card-bg)',
          foreground: 'var(--card-fg)',
        },
        primary: {
          DEFAULT: 'var(--primary-color)',
          foreground: 'var(--primary-fg)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-bg)',
          foreground: 'var(--secondary-fg)',
        },
        muted: {
          DEFAULT: 'var(--muted-bg)',
          foreground: 'var(--muted-fg)',
        },
        border: 'var(--border-color)',
        ring: 'var(--ring-color)',
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        danger: 'var(--danger-color)',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
        xs: '4px',
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(17, 92, 107, 0.15)',
        'luxury-hover': '0 20px 40px -15px rgba(17, 92, 107, 0.25)',
        'forest': '0 10px 30px -10px rgba(42, 88, 65, 0.2)',
        'coral': '0 10px 25px -5px rgba(243, 117, 97, 0.35)',
        'blush': '0 10px 25px -5px rgba(245, 186, 186, 0.45)',
      }
    },
  },
  plugins: [],
}
