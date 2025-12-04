<template>
  <tr>
    <td>{{ relay.name }}</td>
    <td>{{ relay.gpio_pin }}</td>

    <td>
      <button class="btn btn-info" @click="$emit('select-zone', relay)">
        <i class="bi bi-clock"></i>
      </button>
    </td>

    <td>
      <button
        @click="toggleActive"
        :disabled="runningSchedules.length > 0"
        class="btn"
        :class="relay.active == 1 ? 'btn-danger' : 'btn-success'"
      >
        {{ relay.active == 1 ? "OFF" : "ON" }}

        <div v-if="runningSchedules.length > 0">
          <i class="bi bi-alarm"></i>
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
    relay: {
      type: Object,
      required: true,
    },
  },
  methods: {
    toggleActive() {
      this.relay.active = this.relay.active == 1 ? 0 : 1;
      axios.post(`/api/relays/${this.relay.id}`, this.relay).catch((err) => {
        this.relay.active = this.relay.active == 1 ? 0 : 1;
        this.$toast.error(err.response.data);
      });
    },
    deleteRelay() {
      axios.delete(`/api/relays/${this.relay.id}`).then(() => {
        this.$toast.success("Zone deleted");
      });
    },
  },
  computed: {
    runningSchedules() {
      return this.relay.schedules.filter((s) => s.status === "running");
    },
  },
};
</script>
