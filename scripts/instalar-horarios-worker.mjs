#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { chmod, mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
loadEnvConfig(projectRoot)

const apiUrl = process.env.HORARIOS_API_URL || ''
if (!apiUrl.startsWith('https://drama.com.ar/')) {
  throw new Error(
    'Antes de instalar, configurá HORARIOS_API_URL=https://drama.com.ar/api/horarios/sync en .env.local.'
  )
}
if (!process.env.HORARIOS_SYNC_SECRET) {
  throw new Error('Antes de instalar, configurá HORARIOS_SYNC_SECRET en .env.local y Vercel.')
}

const label = 'local.drama.horarios'
const launchAgents = path.join(homedir(), 'Library', 'LaunchAgents')
const logs = path.join(homedir(), 'Library', 'Logs', 'drama-horarios')
const plist = path.join(launchAgents, `${label}.plist`)
const domain = `gui/${process.getuid()}`
const worker = path.join(projectRoot, 'scripts', 'horarios-worker.mjs')

await Promise.all([mkdir(launchAgents, { recursive: true }), mkdir(logs, { recursive: true })])

const document = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${escapeXml(label)}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string>
    <string>-i</string>
    <string>${escapeXml(process.execPath)}</string>
    <string>${escapeXml(worker)}</string>
  </array>
  <key>WorkingDirectory</key><string>${escapeXml(projectRoot)}</string>
  <key>RunAtLoad</key><true/>
  <key>StartInterval</key><integer>1800</integer>
  <key>ThrottleInterval</key><integer>60</integer>
  <key>EnvironmentVariables</key>
  <dict>
    <key>OLLAMA_NO_CLOUD</key><string>1</string>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>StandardOutPath</key><string>${escapeXml(path.join(logs, 'worker.log'))}</string>
  <key>StandardErrorPath</key><string>${escapeXml(path.join(logs, 'worker-error.log'))}</string>
</dict>
</plist>
`

await writeFile(plist, document, { encoding: 'utf-8', mode: 0o600 })
await chmod(plist, 0o600)

try {
  execFileSync('/bin/launchctl', ['bootout', `${domain}/${label}`], { stdio: 'ignore' })
} catch {}
execFileSync('/bin/launchctl', ['bootstrap', domain, plist])

console.log('Horarios instalado: cada 30 minutos, solo entre las 08:00 y las 23:00 de Buenos Aires.')
console.log(`Logs: ${logs}`)

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

