<template>
  <div v-if="addingSchedule" class="schedule p-3">
    <label class="fw-bold">Start Time:</label>
    <input v-model="start_time" type="time" class="form-control mb-2" />

    <label class="fw-bold">Duration:</label>
    <div class="input-group mb-2">
      <input v-model="duration_min" type="number" class="form-control" />
      <span class="input-group-text">minutes</span>
    </div>

    <label class="fw-bold">Days:</label>
    <Days class="mb-2" v-model="days" />

    <div class="mb-2">
      <label class="fw-bold">Type:</label><br />
      <Toggle v-model="one_time" offLabel="Recurring" onLabel="One-Off" />
    </div>

    <div class="d-flex gap-2">
      <button class="btn btn-danger w-50" @click="reset">Cancel</button>
      <button class="btn btn-success w-50" @click="submit" :disabled="!start_time || !duration_min || loading">
        <span v-if="loading" class="spinner-border"></span><span v-else>Save</span>
      </button>
    </div>
  </div>
</template>

<script>
import Days from "../Days.vue";
import Toggle from "@vueform/toggle";
export default {
  components: {
    Days,
    Toggle,
  },
  props: {
    zone: Object,
    addingSchedule: Boolean,
  },
  data() {
    return {
      loading: false,
      start_time: null,
      duration_min: null,
      one_time: false,
      days: [],
    };
  },
  methods: {
    submit() {
      this.loading = true;
      axios
        .post(`/api/schedules`, {
          zone_id: this.zone.id,
          start_time: this.start_time,
          duration_min: this.duration_min,
          one_time: this.one_time,
          days: this.days,
        })
        .then(() => {
          this.reset();
          this.$toast.success("Schedule created");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    reset() {
      this.start_time = null;
      this.duration_min = null;
      this.one_time = false;
      this.days = [];
      this.$emit("off");
    },
  },
};
</script>
