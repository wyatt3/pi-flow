<template>
  <div class="position-relative">
    <button class="btn btn-danger delete-schedule bi bi-x" @click="deleteSchedule"></button>

    <div class="d-flex flex-wrap justify-content-end">
      <div class="schedule-item start-time">
        <label class="fw-bold me-2">Start Time:</label>
        <span>{{ formattedTime }}</span>
      </div>

      <div class="schedule-item duration">
        <label class="fw-bold me-2">Duration:</label>
        <span>{{ schedule.duration_min }} minutes</span>
      </div>

      <div class="d-flex schedule-item days">
        <label class="fw-bold me-2">Days:</label>
        <div class="d-flex gap-2">
          <span class="day-box" :class="{ 'bg-info': schedule.days.includes(i) }" v-for="(d, i) in dayNames" :key="i">{{
            d
          }}</span>
        </div>
      </div>

      <div class="schedule-item type">
        <label class="fw-bold me-2">Type:</label>
        <span>{{ schedule.one_time ? "One-Off" : "Recurring" }}</span>
      </div>

      <div class="schedule-item status">
        <label class="fw-bold me-2">Status:</label>

        <span v-if="schedule.status !== 'running'" class="px-2 py-1 rounded text-uppercase bg-success text-white">
          {{ schedule.status }}
        </span>

        <span v-else class="px-2 py-1 rounded text-uppercase bg-warning">
          Running -
          <Countdown :startTime="schedule.start_time" :durationMin="schedule.duration_min" />
        </span>
      </div>
    </div>

    <button @click="toggleSkipNext" class="w-100 mt-3 btn" :class="schedule.skip_next ? 'btn-danger' : 'btn-warning'">
      <i class="bi" :class="schedule.skip_next ? 'bi-skip-backward-fill' : 'bi-skip-forward-fill'"></i>
      {{ schedule.skip_next ? "Unskip Next Occurrence" : "Skip Next Occurrence" }}
    </button>
  </div>
</template>

<script>
import Countdown from "../Countdown.vue";

export default {
  components: {
    Countdown,
  },
  props: {
    schedule: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
    };
  },
  computed: {
    formattedTime() {
      const [H, M] = this.schedule.start_time.split(":");
      return `${H % 12}:${M} ${H < 12 ? "AM" : "PM"}`;
    },
  },
};
</script>
