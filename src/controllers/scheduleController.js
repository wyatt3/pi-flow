import db from '../config/db.js';
import Zone from '../models/zone.js';
import Schedule from '../models/schedule.js';
import ScheduleService from '../services/scheduleService.js';

export default class ScheduleController {
    static create(req, res) {
        const { zone_id, start_time, duration_min, one_time, days } = req.body;

        if (!zone_id || !start_time || !duration_min || one_time === null || !days) {
            return res.status(400).json({ error: 'zone_id, start_time, duration_min, one_time, days required' });
        }
        const result = db.prepare('SELECT * FROM zones WHERE id = ?').get(zone_id);
        if (!result) {
            return res.status(400).json({ error: 'invalid zone_id' });
        }
        const zone = new Zone(result);

        try {
            const schedule = ScheduleService.createSchedule(zone, start_time, duration_min, one_time, days);
            return res.status(201).json(schedule);
        } catch (err) {
            return res.status(400).json(err.message);
        }
    }

    static update(req, res) {
        const { id } = req.params;
        const { start_time, duration_min, one_time, skip_next, days } = req.body;

        const result = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
        const schedule = new Schedule(result);
        try {
            ScheduleService.updateSchedule(schedule, start_time, duration_min, one_time, skip_next, days);
            return res.status(200).json(schedule);
        } catch (err) {
            return res.status(400).json(err.message);
        }
    }

    static delete(req, res) {
        const { id } = req.params;
        const result = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
        const schedule = new Schedule(result);
        try {
            ScheduleService.deleteSchedule(schedule);
            return res.status(204).json();
        } catch (err) {
            return res.status(400).json(err.message);
        }
    }
}
