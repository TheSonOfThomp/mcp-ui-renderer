import { defineConfig, type Plugin, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname, basename, parse } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

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
    // Use a regex or replaceAll to replace all occurrences
    return entryTemplateContent.replace(/__COMPONENT_NAME__/g, name)
  }

  return {
    name: 'micro-ui-entry-generator',
    config() {
      const input: Record<string, string> = {
        main: resolve(__dirname, 'index.html'),
      }

      // Add an input for each component
      components.forEach(name => {
        input[name] = `virtual:micro-uis/${name}.html`
      })

      return {
        build: {
          rollupOptions: {
            input
          }
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
          // Check if this matches one of our components
          if (components.includes(name)) {
            const html = getHtml(name, `/@id/virtual:micro-uis/${name}.entry.tsx`)
            try {
              // Transform HTML (inject Vite scripts)
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
  plugins: [react(), microUIPlugin()],
})
