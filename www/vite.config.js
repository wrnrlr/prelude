import * as path from '@std/path'
import * as fs from '@std/fs'
import {defineConfig} from 'vite'
import { Application, TSConfigReader, TypeDocReader } from 'typedoc'

function typedocPlugin() {
  let _config
  return {
    name: 'typedoc-plugin',
    apply: 'build',
    configResolved(config) { _config = config },
    async writeBundle() {
      const config = JSON.parse(await Deno.readTextFile('./typedoc.jsonc'))
      const app = await Application.bootstrap(config)
      const project = await app.convert()
      await app.generateDocs(project, config.out)
    }
  };
}

export default defineConfig(({ command, mode }) => {
  const root = path.join(__dirname, '')

  const define = {}
  let build
  const optimizeDeps = {
    // exclude: ['dist/','public/'],
  }
  const assetsInclude = [
    // 'public/example/**'
  ]

  // if (command==='serve') {
    // build = {}
  // } else {
    build = {
      // lib: {
      //   entry: 'src/mod.ts', formats: ['es']
      // },
      rollupOptions: {
        input: {
          'index': path.join(root, 'index.html'),
          'playground': path.join(root, 'playground.html'),
          'docs': path.join(root, 'docs/index.html'),
        }
        // input: {
        //   'index.html': 'index.html',
        //   'playground.html': 'playground.html',
        //   // 'mod.js': 'src/mod.ts',
        // },
        // output: {
        //   entryFileNames: (info) => {
        //     console.log(info.name,info.type)
        //     return info.name+'.js'
        //   }
        // }
      }
    }
  // }

  return {
    root,
    define,
    build,
    optimizeDeps,
    assetsInclude,
    base: mode==='production' ? '/prelude' : undefined,
    plugins: [
      // typedocPlugin()
    ]
  }
})
