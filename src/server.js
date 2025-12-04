import cron from 'node-cron';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import http from 'http';
import path from 'path';
import ZoneService from './services/zoneService.js';
import ScheduleService from './services/scheduleService.js';
import routes from './routes/api.js';
import websocketService from './services/websocketService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', routes);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT;
const server = http.createServer(app);
websocketService.initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

process.on('SIGINT', () => {
    ZoneService.turnOffAllZones();
    process.exit(0);
});

cron.schedule('* * * * *', async () => {
    ScheduleService.runSchedules();
});
