import db from '../config/db.js';
import moment from 'moment-timezone';
import Zone from '../models/zone.js';
import Schedule from '../models/schedule.js';
import websocketService from '../services/websocketService.js';
import ZoneService from './zoneService.js';

export default class ScheduleService {
    static createSchedule(zone, start_time, duration_min, one_time, days) {
        const result = db.prepare(
            `INSERT INTO schedules (zone_id, start_time, duration_min, one_time)
            VALUES (?, ?, ?, ?)`
        ).run(zone.id, start_time, duration_min, Number(one_time));
        const schedule = new Schedule({ id: result.lastInsertRowid, zone_id: zone.id, start_time: start_time, duration_min: duration_min, one_time: one_time, status: 'scheduled' });
        ScheduleService.setDays(schedule, days);
        websocketService.broadcastUpdate();
        return schedule;
    }

    static updateSchedule(schedule, start_time, duration_min, one_time, skip_next, days) {
        db.prepare(
            `UPDATE schedules SET start_time = ?, duration_min = ?, one_time = ?, skip_next = ? WHERE id = ?`
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
        return;
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
        const zone = new Zone(result);
        if (!zone) {
            console.log(`Schedule: ${schedule.id} has an invalid zone_id, deleting`);
            ScheduleService.deleteSchedule(schedule);
            return;
        }
        ZoneService.save(zone, 0);
        console.log(`Activated GPIO Pin: ${zone.gpio_pin}`);

        db.prepare(
            `UPDATE schedules SET status = ? WHERE id = ?`
        ).run('running', schedule.id);
        websocketService.broadcastUpdate();

        const timeout = schedule.duration_min * 60 * 1000;
        setTimeout(() => {
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
        }, timeout);
    }
}
