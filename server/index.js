const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname, 'data')
const STATE_FILE = path.join(DATA_DIR, 'studios.json')

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR)
}

const CANVAS_WIDTH = 100
const CANVAS_HEIGHT = 40
const COOLDOWN_MS = 5 * 60 * 1000

let studios = {
    'default': Array(CANVAS_HEIGHT).fill(null).map(() => Array(CANVAS_WIDTH).fill('#ffffff')),
    'studio-2': Array(CANVAS_HEIGHT).fill(null).map(() => Array(CANVAS_WIDTH).fill('#ffffff')),
    'studio-3': Array(CANVAS_HEIGHT).fill(null).map(() => Array(CANVAS_WIDTH).fill('#ffffff'))
}

if (fs.existsSync(STATE_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
        studios = { ...studios, ...data }
    } catch (e) {
        // Ignore error
    }
}

const userCooldowns = new Map()

function saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(studios))
}

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message)

            if (data.type === 'JOIN') {
                ws.studioId = data.studioId
                if (studios[data.studioId]) {
                    const key = `${ip}:${data.studioId}`
                    ws.send(JSON.stringify({
                        type: 'INIT',
                        canvas: studios[data.studioId],
                        cooldown: userCooldowns.get(key) || 0
                    }))
                }
            } else if (data.type === 'DRAW') {
                const { x, y, color } = data
                const now = Date.now()
                // Use compound key for studio-specific cooldown
                const key = `${ip}:${ws.studioId}`
                const lastDraw = userCooldowns.get(key) || 0

                if (now - lastDraw < COOLDOWN_MS) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Cooldown active',
                        cooldown: lastDraw
                    }))
                    return
                }

                if (ws.studioId && studios[ws.studioId]) {
                    if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
                        studios[ws.studioId][y][x] = color
                        userCooldowns.set(key, now)
                        saveState()

                        wss.clients.forEach(client => {
                            if (client.studioId === ws.studioId && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: 'UPDATE',
                                    x,
                                    y,
                                    color
                                }))
                            }
                        })

                        ws.send(JSON.stringify({
                            type: 'COOLDOWN_START',
                            timestamp: now
                        }))
                    }
                }
            }
        } catch (e) {
            // Ignore
        }
    })
})

app.get('/studios', (req, res) => {
    res.json(Object.keys(studios))
})

server.listen(3000, () => {
    console.log('Server running on port 3000')
})
