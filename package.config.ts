import { defineConfig } from '@sanity/pkg-utils'
import css from 'rollup-plugin-import-css'

export default defineConfig({
  rollup: {
    plugins: [css()],
  },
})
