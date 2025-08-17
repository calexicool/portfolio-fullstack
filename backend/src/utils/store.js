const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const dataDir = path.join(__dirname, '..', '..', 'storage')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const files = {
  content: path.join(dataDir, 'content.json'),
  comments: path.join(dataDir, 'comments.json'),
  users: path.join(dataDir, 'users.json')
}

async function readJSON(file, fallback){
  try{ const raw = await fsp.readFile(file, 'utf8'); return JSON.parse(raw) }catch{ return fallback }
}
async function writeJSON(file, data){
  const tmp = file + '.tmp'; await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8'); await fsp.rename(tmp, file)
}
async function ensureInitialized(){
  if(!fs.existsSync(files.content)) await writeJSON(files.content, { content: null })
  if(!fs.existsSync(files.comments)) await writeJSON(files.comments, [])
  if(!fs.existsSync(files.users)) await writeJSON(files.users, [])
}
module.exports = { files, readJSON, writeJSON, ensureInitialized }
