<template>
  <div>
    <div class="schedule p-3 mb-3" v-for="schedule in zone.schedules" :key="schedule.id">
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
  },
};
</script>
