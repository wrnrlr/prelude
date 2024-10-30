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
      const name = path.join(__dirname, 'typedoc.json')
      const config = JSON.parse(await Deno.readTextFile(name))
      config.hostedBaseUrl = '/prelude'
      config.useHostedBaseUrlForAbsoluteLinks = true
      config.out = './www/dist/docs'
      config.entryPoints = ['./src/mod.ts']
      const app = await Application.bootstrap(config)
      const project = await app.convert()
      console.log('PROJECT', project)
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

  const input = {
    'index': path.join(root, 'index.html'),
    'playground': path.join(root, 'playground.html'),
  }
  if (fs.existsSync('docs/index.html')) input[docs] = path.join(root, 'docs/index.html')

  build = {
    // lib: { entry: 'src/mod.ts', formats: ['es'] },
    rollupOptions: {
      input
    }
  }

  return {
    root,
    define,
    build,
    optimizeDeps,
    assetsInclude,
    base: '/prelude',
    plugins: [
      typedocPlugin()
    ]
  }
})
