import db from '../config/db.js';
import pinToLineMap from '../config/pinToLineMap.js';
import Zone from '../models/zone.js';
import ZoneService from '../services/zoneService.js';

export default class ZoneController {
    static getAll(req, res) {
        const rows = db.prepare('SELECT * FROM zones ORDER BY name').all();
        const zones = rows.map((row) => {
            try {
                return new Zone(row)
            } catch (err) {
                return row
            }
        });
        return res.json(zones);
    }

    static create(req, res) {
        const { name, gpio_pin } = req.body;
        if (!name || gpio_pin == null) return res.status(400).json('name & gpio_pin required');
        if (!(pinToLineMap[gpio_pin])) return res.status(400).json('Invalid GPIO pin');
        try {
            const zone = ZoneService.create(name, gpio_pin);
            return res.status(201).json(zone);
        } catch (err) {
            return res.status(400).json(err.message);
        }
    }

    static update(req, res) {
        const { id } = req.params;
        const result = db.prepare('SELECT * FROM zones WHERE id = ?').get(id);
        let zone = new Zone(result);
        try {
            zone = ZoneService.save(zone, Number(req.body.active));
            return res.status(200).json(zone);
        } catch (err) {
            return res.status(400).json(err.message);
        }
    }

    static delete(req, res) {
        const { id } = req.params;
        const result = db.prepare('SELECT * FROM zones WHERE id = ?').get(id);
        const zone = new Zone(result);
        try {
            ZoneService.delete(zone);
            return res.status(204).json();
        } catch (err) {
            return res.status(400).json(err.message);
        }
    }

}

