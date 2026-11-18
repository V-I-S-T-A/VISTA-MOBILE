// Tailwind loads the same presentation tokens used by native styles.
// DM Sans and component geometry remain owned by src/theme/tokens.js.
const { colors, radii, type } = require('./src/theme/tokens');
const px = value => String(value) + 'px';
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.jsx", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: [type.regular],
      },
      fontSize: {
        xs: [px(type.meta.fontSize), { lineHeight: px(type.meta.lineHeight) }],
        sm: [px(type.field.fontSize), { lineHeight: px(type.field.lineHeight) }],
        base: [px(type.heading.fontSize), { lineHeight: px(type.heading.lineHeight) }],
        lg: [px(type.navigationTitle.fontSize), { lineHeight: px(type.navigationTitle.lineHeight) }],
        xl: [px(type.title.fontSize), { lineHeight: px(type.title.lineHeight) }],
        '2xl': [px(type.display.fontSize), { lineHeight: px(type.display.lineHeight) }],
      },
      borderRadius: { lg: radii.field, xl: radii.listCard, '2xl': radii.card, '3xl': radii.sheet },
      colors: {
        vistaNavy: colors.navy,
        vistaOrange: colors.yellow,
        vistaYellow: colors.yellow,
      },
    },
  },
  plugins: [],
};
