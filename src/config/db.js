import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('database', 'database.sqlite');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);

// initialize schema
db.exec(`
CREATE TABLE IF NOT EXISTS zones (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
gpio_pin INTEGER NOT NULL,
active INTEGER DEFAULT 0,
UNIQUE(gpio_pin)
);

CREATE TABLE IF NOT EXISTS schedules (
id INTEGER PRIMARY KEY AUTOINCREMENT,
zone_id INTEGER NOT NULL,
start_time TIME NOT NULL,
duration_min INTEGER NOT NULL,
one_time BOOLEAN DEFAULT 0,
status TEXT NOT NULL DEFAULT 'idle',
skip_next BOOLEAN DEFAULT 0,
FOREIGN KEY(zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_days (
id INTEGER PRIMARY KEY AUTOINCREMENT,
schedule_id INTEGER NOT NULL,
day INTEGER NOT NULL,
FOREIGN KEY(schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);
`);

export default db;
