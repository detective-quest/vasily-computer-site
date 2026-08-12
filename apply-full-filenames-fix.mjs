import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const stylesRoot = path.join(projectRoot, 'src', 'styles')
const fileManagerTs = path.join(projectRoot, 'src', 'ui', 'file-manager.ts')

if (!fs.existsSync(stylesRoot)) {
  throw new Error(`Styles folder not found: ${stylesRoot}`)
}

if (!fs.existsSync(fileManagerTs)) {
  throw new Error(`File manager source not found: ${fileManagerTs}`)
}

const fileManagerSource = fs.readFileSync(fileManagerTs, 'utf8')
if (!fileManagerSource.includes('file-manager-item__details')) {
  throw new Error('Unexpected file-manager.ts structure. Fix stopped without changes.')
}

function walkCss(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walkCss(fullPath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.css')) {
      result.push(fullPath)
    }
  }
  return result
}

const cssFiles = walkCss(stylesRoot)
const candidates = cssFiles.filter((cssPath) => {
  const text = fs.readFileSync(cssPath, 'utf8')
  return (
    text.includes('.file-manager-item') &&
    text.includes('.file-manager-item__details')
  )
})

if (candidates.length === 0) {
  throw new Error('Could not find the CSS file that styles file-manager items.')
}

const cssPath = candidates[0]
let css = fs.readFileSync(cssPath, 'utf8')

const startMarker = '/* FULL_FILENAMES_FIX_START */'
const endMarker = '/* FULL_FILENAMES_FIX_END */'

const oldBlockPattern = new RegExp(
  `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`,
  'g',
)

css = css.replace(oldBlockPattern, '').trimEnd()

const fixBlock = `

${startMarker}
/*
 * File and folder names must always remain fully readable.
 * No ellipsis / single-line clipping on desktop or mobile.
 */
.file-manager-items {
  align-items: start;
  grid-auto-rows: max-content;
}

.file-manager-item {
  min-width: 0;
  height: auto !important;
  min-height: 0;
  grid-template-rows: auto auto;
  align-content: start;
}

.file-manager-item__details {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: visible !important;
}

.file-manager-item__details strong {
  display: block !important;
  width: 100%;
  max-width: 100%;
  max-height: none !important;
  overflow: visible !important;
  text-overflow: clip !important;
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
  -webkit-line-clamp: unset !important;
  -webkit-box-orient: initial !important;
  line-height: 1.28;
}

.file-manager-item__details small {
  max-width: 100%;
  overflow-wrap: anywhere;
}

/* Search results use the same cards, so long paths must not force clipping. */
.file-manager-content,
.file-manager-items {
  min-width: 0;
}

@media (max-width: 820px) {
  .file-manager-items {
    grid-template-columns: minmax(0, 1fr) !important;
    grid-auto-rows: max-content;
  }

  .file-manager-item {
    width: 100%;
    min-width: 0;
    height: auto !important;
    min-height: 0;
  }

  .file-manager-item__details strong {
    white-space: normal !important;
    text-overflow: clip !important;
    overflow: visible !important;
    line-height: 1.3;
  }
}
${endMarker}
`

fs.writeFileSync(cssPath, `${css}${fixBlock}\n`, 'utf8')

console.log('')
console.log('Full filename fix applied successfully.')
console.log(`Updated: ${path.relative(projectRoot, cssPath)}`)
console.log('File and folder names can now wrap to multiple lines on desktop and mobile.')
