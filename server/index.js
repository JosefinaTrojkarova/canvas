const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname, 'data')
const STATE_FILE = path.join(DATA_DIR, 'studios.json')
const DB_FILE = path.join(DATA_DIR, 'canvas.db')

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR)
}

const db = new sqlite3.Database(DB_FILE)

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )`)

    // Create tokens table for simple session management
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userId TEXT
    )`)
})

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

// Auth Endpoints
app.post('/api/register', (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const id = uuidv4()

    db.run('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [id, username, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already taken' })
            }
            return res.status(500).json({ error: 'Database error' })
        }

        // Auto-login
        const token = uuidv4()
        db.run('INSERT INTO sessions (token, userId) VALUES (?, ?)', [token, id], (err) => {
            if (err) return res.status(500).json({ error: 'Session creation failed' })
            res.json({ token, username, userId: id })
        })
    })
})

app.post('/api/login', (req, res) => {
    const { username, password } = req.body

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' })
        if (!user) return res.status(400).json({ error: 'Invalid credentials' })

        if (bcrypt.compareSync(password, user.password)) {
            const token = uuidv4()
            db.run('INSERT INTO sessions (token, userId) VALUES (?, ?)', [token, user.id], (err) => {
                if (err) return res.status(500).json({ error: 'Session creation failed' })
                res.json({ token, username, userId: user.id })
            })
        } else {
            res.status(400).json({ error: 'Invalid credentials' })
        }
    })
})

// Helper to validate token
const validateToken = (token) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT userId FROM sessions WHERE token = ?', [token], (err, row) => {
            if (err || !row) resolve(null)
            else resolve(row.userId)
        })
    })
}

wss.on('connection', (ws, req) => {
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message)

            if (data.type === 'JOIN') {
                const userId = await validateToken(data.token)

                if (!userId) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Unauthorized',
                        code: 'UNAUTHORIZED' // Client can use this to redirect to login
                    }))
                    return
                }

                ws.userId = userId
                ws.studioId = data.studioId

                if (studios[data.studioId]) {
                    // Use userId for cooldown key
                    const key = `${ws.userId}:${data.studioId}`
                    ws.send(JSON.stringify({
                        type: 'INIT',
                        canvas: studios[data.studioId],
                        cooldown: userCooldowns.get(key) || 0
                    }))
                }
            } else if (data.type === 'DRAW') {
                if (!ws.userId) return // Not authenticated

                const { x, y, color } = data
                const now = Date.now()
                // Use userId for cooldown key
                const key = `${ws.userId}:${ws.studioId}`
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
            console.error(e)
        }
    })
})

app.get('/studios', (req, res) => {
    res.json(Object.keys(studios))
})

server.listen(3000, () => {
    console.log('Server running on port 3000')
})
