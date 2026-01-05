<template>
  <div class="schedule-list">
    <div v-if="!addingSchedule && zone.schedules.length == 0" class="empty-state-small">
      <i class="bi bi-calendar-x"></i>
      <p>No schedules yet</p>
    </div>
    <div v-for="schedule in zone.schedules" :key="schedule.id" class="schedule-list-item">
      <ScheduleItem :schedule="schedule" />
    </div>
  </div>
</template>

<script>
import ScheduleItem from "./ScheduleItem.vue";

export default {
  components: {
    ScheduleItem,
  },
  props: {
    zone: {
      type: Object,
      required: true,
    },
    addingSchedule: Boolean,
  },
};
</script>

<style scoped>
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state-small {
  text-align: center;
  padding: 2rem 1rem;
  background: var(--pf-bg);
  border-radius: var(--pf-radius-lg);
  color: var(--pf-text-muted);
}

.empty-state-small i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-state-small p {
  margin: 0;
  font-size: 0.9375rem;
}
</style>
