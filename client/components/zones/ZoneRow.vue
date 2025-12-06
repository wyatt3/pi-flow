<template>
  <tr>
    <td>{{ zone.name }}</td>
    <td>{{ zone.gpio_pin }}</td>

    <td>
      <button class="btn btn-info" @click="$emit('select-zone', zone)">
        <i class="bi bi-clock"></i>
      </button>
    </td>

    <td class="status-button-td">
      <button
        @click="toggleActive"
        :disabled="runningSchedules.length > 0"
        class="btn status-button"
        :class="zone.active == 1 ? 'btn-danger' : 'btn-success'"
      >
        {{ zone.active == 1 ? "OFF" : "ON" }}

        <div v-if="runningSchedules.length > 0">
          <i class="bi bi-alarm me-2"></i>
          <Countdown :startTime="runningSchedules[0].start_time" :durationMin="runningSchedules[0].duration_min" />
        </div>
      </button>
    </td>

    <td>
      <button class="btn btn-danger bi bi-trash" @click="deleteZone"></button>
    </td>
  </tr>
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
      axios.delete(`/api/zones/${this.zone.id}`).then(() => {
        this.$toast.success("Zone deleted");
      });
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
td {
  vertical-align: middle;
  text-align: center;
}

.status-button-td {
  padding: 5px;
}

.status-button {
  min-width: 90px;
  padding: 6px;
}
</style>
