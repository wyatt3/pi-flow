<template>
  <div class="zone-card" :class="{ 'is-active': zone.active == 1 }">
    <div class="zone-card-header">
      <div class="zone-card-info">
        <h3>{{ zone.name }}</h3>
        <span class="gpio-label">
          <i class="bi bi-cpu"></i>
          GPIO {{ zone.gpio_pin }}
        </span>
      </div>
      <div class="zone-card-actions">
        <button
          class="btn-pf btn-pf-ghost btn-pf-icon"
          @click="deleteZone"
          title="Delete zone"
        >
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>

    <div class="zone-card-footer">
      <button
        class="btn-pf btn-pf-info"
        @click="$emit('select-zone', zone)"
      >
        <i class="bi bi-calendar-week"></i>
        Schedules
        <span v-if="zone.schedules.length > 0" class="schedule-count">
          {{ zone.schedules.length }}
        </span>
      </button>

      <button
        @click="toggleActive"
        :disabled="runningSchedules.length > 0"
        class="status-toggle"
        :class="zone.active == 1 ? 'is-on' : 'is-off'"
      >
        <span class="status-dot"></span>
        <span v-if="runningSchedules.length > 0" class="running-info">
          <Countdown
            :startTime="runningSchedules[0].start_time"
            :durationMin="runningSchedules[0].duration_min"
          />
        </span>
        <span v-else>
          {{ zone.active == 1 ? "ON" : "OFF" }}
        </span>
      </button>
    </div>
  </div>
</template>

<script>
import Countdown from "../Countdown.vue";
export default {
  components: {
    Countdown,
  },
  props: {
    zone: {
      type: Object,
      required: true,
    },
  },
  methods: {
    toggleActive() {
      this.zone.active = this.zone.active == 1 ? 0 : 1;
      axios.post(`/api/zones/${this.zone.id}`, this.zone).catch((err) => {
        this.zone.active = this.zone.active == 1 ? 0 : 1;
        this.$toast.error(err.response.data);
      });
    },
    deleteZone() {
      if (confirm("Are you sure you want to delete this zone?")) {
        axios.delete(`/api/zones/${this.zone.id}`).then(() => {
          this.$toast.success("Zone deleted");
        });
      }
    },
  },
  computed: {
    runningSchedules() {
      return this.zone.schedules.filter((s) => s.status === "running");
    },
  },
};
</script>

<style scoped>
.schedule-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
}

.running-info {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 600;
}
</style>
