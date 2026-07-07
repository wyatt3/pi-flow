import db from '../config/db.js';
import moment from 'moment-timezone';
import Zone from '../models/zone.js';
import Schedule from '../models/schedule.js';
import websocketService from '../services/websocketService.js';
import ZoneService from './zoneService.js';

export default class ScheduleService {
    static createSchedule(zone, start_time, duration_min, one_time, days) {
        ScheduleService.checkForScheduleOverlap(
            zone.id,
            start_time,
            duration_min,
            days
        );

        const result = db.prepare(
            `INSERT INTO schedules (zone_id, start_time, duration_min, one_time)
         VALUES (?, ?, ?, ?)`
        ).run(zone.id, start_time, duration_min, Number(one_time));

        const schedule = new Schedule({
            id: result.lastInsertRowid,
            zone_id: zone.id,
            start_time,
            duration_min,
            one_time,
            status: 'scheduled'
        });

        ScheduleService.setDays(schedule, days);
        websocketService.broadcastUpdate();
        return schedule;
    }

    static updateSchedule(schedule, start_time, duration_min, one_time, skip_next, days) {
        ScheduleService.checkForScheduleOverlap(
            schedule.zone_id,
            start_time,
            duration_min,
            days,
            schedule.id
        );

        db.prepare(
            `UPDATE schedules
         SET start_time = ?, duration_min = ?, one_time = ?, skip_next = ?
         WHERE id = ?`
        ).run(start_time, duration_min, Number(one_time), Number(skip_next), schedule.id);

        ScheduleService.setDays(schedule, days);
        websocketService.broadcastUpdate();
        return schedule;
    }

    static setDays(schedule, days) {
        db.prepare(
            `DELETE FROM schedule_days WHERE schedule_id = ?`
        ).run(schedule.id);
        days.forEach((day) => {
            db.prepare(
                `INSERT INTO schedule_days (schedule_id, day)
                VALUES (?, ?)`
            ).run(schedule.id, day);
        })
    }

    static deleteSchedule(schedule) {
        db.prepare(
            `DELETE FROM schedules WHERE id = ?`
        ).run(schedule.id);
        db.prepare(
            `DELETE FROM schedule_days WHERE schedule_id = ?`
        ).run(schedule.id);
        websocketService.broadcastUpdate();
    }

    static deleteByZone(zone) {
        db.prepare(
            `DELETE FROM schedule_days WHERE schedule_id IN (SELECT id FROM schedules WHERE zone_id = ?)`
        ).run(zone.id);
        db.prepare(
            `DELETE FROM schedules WHERE zone_id = ?`
        ).run(zone.id);
    }

    static skipNextOccurrence(schedule) {
        db.prepare(
            `UPDATE schedules SET skip_next = 1 WHERE id = ?`
        ).run(schedule.id);
        websocketService.broadcastUpdate();
        return schedule;
    }

    static runSchedules() {
        const timezone = process.env.TIMEZONE;
        const currentTime = moment().tz(timezone);
        const currentDay = currentTime.day();
        const result = db.prepare(`SELECT * FROM schedules WHERE start_time = ?`).all(currentTime.format('HH:mm'));
        const schedules = result.map((schedule) => new Schedule(schedule));
        schedules.forEach((schedule) => {
            console.log(`[${currentTime.format('YYYY-MM-DD HH:mm')}] Running schedule: ${schedule.id} for ${schedule.duration_min} minute${schedule.duration_min > 1 ? 's' : ''}`);
            if (schedule.days.includes(currentDay)) {
                ScheduleService.runSchedule(schedule);
            }
        });
        websocketService.broadcastUpdate();
    }

    static runSchedule(schedule) {
        if (schedule.skip_next) {
            console.log(`Schedule: ${schedule.id} is set to skip the next occurrence, skipping`);
            ScheduleService.updateSchedule(schedule, schedule.start_time, schedule.duration_min, schedule.one_time, 0, schedule.days);
            return;
        }

        const result = db.prepare(
            `SELECT * FROM zones WHERE id = ?`
        ).get(schedule.zone_id);
        if (!result) {
            console.log(`Schedule: ${schedule.id} has an invalid zone_id, deleting`);
            ScheduleService.deleteSchedule(schedule);
            return;
        }
        const zone = new Zone(result);
        ZoneService.save(zone, 0);
        console.log(`Activated GPIO Pin: ${zone.gpio_pin}`);

        db.prepare(
            `UPDATE schedules SET status = ? WHERE id = ?`
        ).run('running', schedule.id);
        websocketService.broadcastUpdate();

        const timeout = schedule.duration_min * 60 * 1000;
        setTimeout(() => ScheduleService.endSchedule(schedule, zone), timeout);
    }

    static recoverRunningSchedules() {
        const timezone = process.env.TIMEZONE;
        const now = moment().tz(timezone);
        const runningSchedules = db.prepare(
            "SELECT * FROM schedules WHERE status = 'running'"
        ).all();

        runningSchedules.forEach((row) => {
            const schedule = new Schedule(row);
            const zoneRow = db.prepare('SELECT * FROM zones WHERE id = ?').get(schedule.zone_id);

            if (!zoneRow) {
                console.log(`Recovery: Schedule ${schedule.id} has an invalid zone_id, deleting`);
                ScheduleService.deleteSchedule(schedule);
                return;
            }

            const zone = new Zone(zoneRow);

            const [hours, minutes] = schedule.start_time.split(':').map(Number);
            let startTime = moment().tz(timezone).hours(hours).minutes(minutes).seconds(0).milliseconds(0);

            if (startTime.isAfter(now)) {
                startTime.subtract(1, 'day');
            }

            const elapsedMs = now.diff(startTime);
            const elapsedMinutes = elapsedMs / (60 * 1000);
            const remainingMinutes = schedule.duration_min - elapsedMinutes;

            if (remainingMinutes <= 0) {
                ZoneService.save(zone, 1);
                db.prepare("UPDATE schedules SET status = 'idle' WHERE id = ?").run(schedule.id);
                console.log(`Recovery: Schedule ${schedule.id} has expired, turned zone ${zone.name} OFF`);
            } else {
                setTimeout(() => ScheduleService.endSchedule(schedule, zone), remainingMinutes * 60 * 1000);
                console.log(`Recovery: Schedule ${schedule.id} still running, ${remainingMinutes.toFixed(1)} minutes remaining`);
            }
        });

        websocketService.broadcastUpdate();
    }

    static endSchedule(schedule, zone) {
        const scheduleExists = db.prepare(
            `SELECT * FROM schedules WHERE id = ?`
        ).get(schedule.id);
        const zoneExists = db.prepare(
            `SELECT * FROM zones WHERE id = ?`
        ).get(schedule.zone_id);

        if (!zoneExists) {
            console.log(`Schedule: ${schedule.id} has an invalid zone_id, deleting`);
            ScheduleService.deleteSchedule(schedule);
            return;
        }

        if (!scheduleExists) {
            console.log(`Schedule: ${schedule.id} is invalid`);
            return;
        }

        console.log(`[${moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm')}] Schedule: ${schedule.id} complete`);
        ZoneService.save(zone, 1);
        console.log(`Deactivated GPIO Pin: ${zone.gpio_pin}`);
        db.prepare(
            `UPDATE schedules SET status = ? WHERE id = ?`
        ).run('idle', schedule.id);

        if (schedule.one_time) {
            console.log(`Schedule: ${schedule.id} is one-time, deleting`);
            ScheduleService.deleteSchedule(schedule);
        }
        websocketService.broadcastUpdate();
    }

    static checkForScheduleOverlap(
        zone_id,
        start_time,
        duration_min,
        days,
        excludeScheduleId = null
    ) {
        const rows = db.prepare(`
        SELECT s.id, s.start_time, s.duration_min, sd.day
        FROM schedules s
        JOIN schedule_days sd ON sd.schedule_id = s.id
        WHERE s.zone_id = ? ${excludeScheduleId ? 'AND s.id != ?' : ''}
    `).all(
            excludeScheduleId ? [zone_id, excludeScheduleId] : [zone_id]
        );

        const schedules = {};
        rows.forEach(row => {
            if (!schedules[row.id]) {
                schedules[row.id] = {
                    start_time: row.start_time,
                    duration_min: row.duration_min,
                    days: []
                };
            }
            schedules[row.id].days.push(row.day);
        });

        const toMinutes = (time) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        const newStart = toMinutes(start_time);
        const newEnd = newStart + duration_min;

        for (const s of Object.values(schedules)) {
            const dayOverlap = days.some(day => s.days.includes(day));
            if (!dayOverlap) continue;

            const existingStart = toMinutes(s.start_time);
            const existingEnd = existingStart + s.duration_min;

            if (newStart < existingEnd && newEnd > existingStart) {
                throw new Error(
                    'Schedule overlaps with an existing schedule on this zone.'
                );
            }
        }
    }
}
