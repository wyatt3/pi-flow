<template>
  <div>
    <div v-if="!addingSchedule && zone.schedules.length == 0" class="schedule p-3 mb-3 text-center">No schedules</div>
    <div class="schedule p-3 mb-3 position-relative" v-for="schedule in zone.schedules" :key="schedule.id">
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
