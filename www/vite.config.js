import * as path from '@std/path'
import * as fs from '@std/fs'
import {defineConfig} from 'vite'
import * as esbuild from 'esbuild'
import { Application, TSConfigReader, TypeDocReader } from 'typedoc'

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
  // const docs = path.join(root, 'distdocs/index.html')
  // if (fs.existsSync(docs)) input.docs = docs
  // console.log('docs',input.docs)

  build = {
    lib: {
      entry: path.join(root, '../src/mod.ts'),
      formats: ['es'],
      name: 'mod',
      fileName: (name) => 'prelude.js'
    },
    rollupOptions: {
      input,
      exports: 'named',
      output: {
        manualChunks(id) {
          // if (id.endsWith('src/mod.ts')) return 'prelude'
        }
      }
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
      esbuildPlugin(), typedocPlugin()
    ]
  }
})

function esbuildPlugin() {
  let ctx
  return {
    name: 'typedoc-plugin',
    async buildStart() {
      const entry = path.join(__dirname, '../src/mod.ts')
      const options = {
        entryPoints: [entry],
        outfile: path.join(__dirname, './public/bundle.js'),
        bundle: true,
        format:'esm',
        // minify: true,
        // sourcemap: true,
        target: ["es2020"],
      }
      ctx = await  esbuild.context(options)
      await ctx.watch()
    },
    async buildEnd() {
      await ctx.dispose()
    }
  }
}

function typedocPlugin() {
  let _config
  return {
    name: 'typedoc-plugin',
    apply: 'build',
    configResolved(config) { _config = config },
    async writeBundle() {
      const name = path.join(__dirname, 'typedoc.json')
      const config = JSON.parse(await Deno.readTextFile(name))
      config.hostedBaseUrl = 'https://wrnrlr.github.io/prelude/docs'
      config.useHostedBaseUrlForAbsoluteLinks = true
      config.out = path.join(__dirname, './dist/docs')
      config.entryPoints = [path.join(__dirname, '../src/mod.ts')]
      const app = await Application.bootstrap(config)
      if (!app) Deno.exit()
      const project = await app.convert()
      if (!project) Deno.exit()
      try {
        await app.generateDocs(project, config.out)
      } catch (e) {
        console.error(e)
      }
    }
  }
}
