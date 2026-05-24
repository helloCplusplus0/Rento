import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadEnvConfig } from '@next/env'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(scriptDir, '..')

// Reuse Next.js env loading so standalone TSX scripts read the same .env precedence
// and variable expansion behavior as the app runtime.
loadEnvConfig(projectDir, process.env.NODE_ENV !== 'production')
