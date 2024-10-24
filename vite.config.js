import * as path from '@std/path'
import {defineConfig} from 'vite'

export default defineConfig(({ command, mode }) => {
  const root = path.join(__dirname, '')

  const define = {}
  let build
  const optimizeDeps = {
    exclude: ['dist/','public/'],
  }
  const assetsInclude = [
    // 'public/example/**'
  ]

  // if (command==='serve') {
    // build = {}
  // } else {
    build = {
      lib: {
        entry: 'src/mod.ts', formats: ['es']
      },
      rollupOptions: {
        input: {
          'index.html': 'index.html',
          'mod.js': 'src/mod.ts',
        },
        output: {
          dir: 'dist',
        }
      }
    }
  // }

  return {
    root,
    define,
    build,
    optimizeDeps,
    assetsInclude,
    base: mode==='production' ? '/prelude' : undefined
  }
})
