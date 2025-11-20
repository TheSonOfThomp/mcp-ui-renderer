import { defineConfig, build, type Plugin, type UserConfig, type InlineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname, basename, parse } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { viteSingleFile } from "vite-plugin-singlefile"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Custom plugin to auto-generate entry points for micro-UIs
const microUIPlugin = (): Plugin => {
  const microUIsDir = resolve(__dirname, 'src/micro-uis')
  const templatePath = resolve(__dirname, 'micro-ui-template.html')
  const entryTemplatePath = resolve(__dirname, 'micro-ui-entry-template.tsx')
  
  // Read the template files once
  const templateContent = fs.readFileSync(templatePath, 'utf-8')
  const entryTemplateContent = fs.readFileSync(entryTemplatePath, 'utf-8')

  const components = fs.readdirSync(microUIsDir)
    .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
    .map(file => parse(file).name)

  const getHtml = (name: string, scriptSrc: string) => {
    return templateContent
      .replace('<!--TITLE-->', name)
      .replace('<!--SCRIPT-->', scriptSrc)
  }

  const getEntry = (name: string) => {
    return entryTemplateContent.replace(/__COMPONENT_NAME__/g, name)
  }

  // Helper to generate the config for a single micro-UI build
  const getComponentBuildConfig = (name: string): InlineConfig => {
    const input: Record<string, string> = {}
    input[name] = `virtual:micro-uis/${name}.html`

    return {
      configFile: false, // Don't load this file again to avoid recursion
      root: resolve(__dirname),
      plugins: [
        react(), 
        microUIPlugin(), // We need this to resolve the virtual modules
        viteSingleFile() // Inline everything for this component
      ],
      build: {
        rollupOptions: {
          input
        },
        emptyOutDir: false, // Don't wipe previous builds
      }
    }
  }

  return {
    name: 'micro-ui-entry-generator',
    
    // Orchestrate the builds when running "vite build" (production)
    async closeBundle() {
      // This hook runs after the main build finishes
      // We only want to run this if we are the "main" build process
      if (process.env.MICRO_UI_CHILD_BUILD) return;

      console.log('\n🏗️  Building Micro-UIs...')
      
      for (const component of components) {
        console.log(`  • ${component}`)
        // Set the env var for the child process
        process.env.MICRO_UI_CHILD_BUILD = 'true'
        
        try {
          await build({
            ...getComponentBuildConfig(component),
            mode: 'production',
          })
        } finally {
          // Clean up
          delete process.env.MICRO_UI_CHILD_BUILD
        }
      }
      console.log('✅ Micro-UIs built successfully.\n')
    },

    config(_config, { mode }) {
      // If this is a child build, we don't need to touch the config here
      // because `getComponentBuildConfig` sets it up explicitly.
      if (process.env.MICRO_UI_CHILD_BUILD) return;

      // This is the Main / Dev config
      const input: Record<string, string> = {
        main: resolve(__dirname, 'index.html'),
      }
      
      // In dev mode, expose all micro-UIs so they can be accessed
      if (mode === 'development') {
         components.forEach(name => {
          input[name] = `virtual:micro-uis/${name}.html`
        })
      }

      return {
        build: {
          rollupOptions: {
            input
          },
          emptyOutDir: true, // Clear dist for the main build
        }
      } as UserConfig
    },

    resolveId(id) {
      if (id.startsWith('virtual:micro-uis/')) {
        return id
      }
    },
    load(id) {
      if (id.startsWith('virtual:micro-uis/')) {
        const matchHtml = id.match(/virtual:micro-uis\/(.+)\.html$/)
        if (matchHtml) {
          const name = matchHtml[1]
          return getHtml(name, `virtual:micro-uis/${name}.entry.tsx`)
        }

        const matchEntry = id.match(/virtual:micro-uis\/(.+)\.entry\.tsx$/)
        if (matchEntry) {
          const name = matchEntry[1]
          return getEntry(name)
        }
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url && url.endsWith('.html')) {
          const name = basename(url, '.html')
          if (components.includes(name)) {
            const html = getHtml(name, `/@id/virtual:micro-uis/${name}.entry.tsx`)
            try {
              const transformed = await server.transformIndexHtml(req.url || '/', html)
              res.setHeader('Content-Type', 'text/html')
              res.end(transformed)
              return
            } catch (e) {
              console.error(e)
              next(e)
            }
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    microUIPlugin(), 
    viteSingleFile(), // Inline assets for the main build as well
  ],
})
