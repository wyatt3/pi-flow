import db from '../config/db.js';
import Zone from '../models/zone.js';
import ScheduleService from './scheduleService.js';
import websocketService from '../services/websocketService.js';


export default class ZoneService {
    static create(name, gpio_pin) {
        const result = db.prepare(
            `INSERT INTO zones (name, gpio_pin, active)
       VALUES (?, ?, 1)`
        ).run(name, gpio_pin);
        websocketService.broadcastUpdate();
        return new Zone({ id: result.lastInsertRowid, name, gpio_pin });
    }

    static save(zone, active) {
        db.prepare(
            `UPDATE zones SET active = ?
       WHERE id = ?`,
        ).run(active, zone.id);
        zone.active = active;
        if (zone.gpio) zone.gpio.writeSync(active);
        websocketService.broadcastUpdate();
        return zone;
    }

    static delete(zone) {
        if (zone.gpio) zone.gpio.writeSync(1);
        ScheduleService.deleteByZone(zone);
        db.prepare(`DELETE FROM zones WHERE id = ?`).run(zone.id);
        websocketService.broadcastUpdate();
    }

    static turnOffAllZones() {
        const rows = db.prepare('SELECT * FROM zones').all();
        const zones = rows.map((row) => new Zone(row));
        zones.forEach((zone) => {
            ZoneService.save(zone, 1);
        });
        websocketService.broadcastUpdate();
    }
}
