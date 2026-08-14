import express from 'express';
import ZoneController from '../controllers/zoneController.js';
import ScheduleController from '../controllers/scheduleController.js';

const router = express.Router();

router.get('/zones/', ZoneController.getAll);
router.post('/zones/', ZoneController.create);
router.post('/zones/:id/', ZoneController.update);
router.delete('/zones/:id/', ZoneController.delete);

router.post('/schedules/', ScheduleController.create);
router.post('/schedules/:id/', ScheduleController.update);
router.post('/schedules/:id/cancel/', ScheduleController.cancel);
router.delete('/schedules/:id/', ScheduleController.delete);

export default router;
