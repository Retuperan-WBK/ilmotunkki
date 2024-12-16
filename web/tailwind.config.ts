/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';
import { DefaultColors } from 'tailwindcss/types/generated/colors';

type Key = keyof DefaultColors;

// Function to validate and get color
const getColor = (colorName: string | undefined, defaultColor: Key) => {
  if(!colorName) {
    return colors[defaultColor];
  }
  if (colorName in colors) {
    return colors[colorName as Key];
  }
  console.warn(`Invalid color name '${colorName}'. Falling back to default '${defaultColor}'.`);
  return colors[defaultColor];
};

const PRIMARY_COLOR = process.env.PRIMARY_COLOR;
const SECONDARY_COLOR = process.env.SECONDARY_COLOR;

const configuration = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // class/media
  theme: {
    extend: {
      colors: {
        primary: getColor(PRIMARY_COLOR,"red"),
        secondary: getColor(SECONDARY_COLOR,"neutral"),
        transparent: colors.transparent,
        success: colors.green,
        danger: colors.red,
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default configuration;

