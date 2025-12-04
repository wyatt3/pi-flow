import db from '../config/db.js';
import Zone from '../models/zone.js';
import { Server as IOServer } from 'socket.io';

class websocketService {
    constructor() {
        this.io = null;
    }

    initSocket(server) {
        if (this.io) return this.io;
        this.io = new IOServer(server, { cors: { origin: '*' } });
        this.io.on('connection', socket => {
            console.log('Socket connected', socket.id);
        });
    }

    broadcastUpdate() {
        if (!this.io) return;
        const rows = db.prepare('SELECT * FROM zones ORDER BY name').all();
        const zones = rows.map((row) => new Zone(row));
        this.io.emit('update', zones);
    }
}

const instance = new websocketService();
export default instance;
