import { Gpio } from 'onoff';
import db from '../config/db.js';
import Schedule from './schedule.js';
import pinToLineMap from '../config/pinToLineMap.js';

export default class Zone {
    constructor({ id = null, name, gpio_pin, active = 1 }) {
        const gpioEnabled = process.env.GPIO_ENABLED == 'true';
        this.id = id;
        this.name = name;
        this.gpio_pin = gpio_pin;
        this.active = active;
        this.gpio = gpioEnabled ? new Gpio(pinToLineMap[this.gpio_pin], active == 0 ? 'out' : 'high') : null;
        this.schedules = db.prepare('SELECT * FROM schedules WHERE zone_id = ? ORDER BY start_time').all(this.id).map((schedule) => new Schedule(schedule));
    }
}
