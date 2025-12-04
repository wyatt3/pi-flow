<template>
  <div class="schedule p-3">
    <label class="fw-bold">Start Time:</label>
    <input v-model="start_time" type="time" class="form-control mb-2" />

    <label class="fw-bold">Duration:</label>
    <div class="input-group mb-2">
      <input v-model="duration_min" type="number" class="form-control" />
      <span class="input-group-text">minutes</span>
    </div>

    <label class="fw-bold">Days:</label>
    <div class="d-flex gap-2 mb-2">
      <button
        v-for="(d, i) in dayNames"
        :key="i"
        @click="toggleDay(i)"
        class="btn day-btn"
        :class="{ 'btn-info': days.includes(i) }"
      >
        {{ d }}
      </button>
    </div>

    <div class="mb-2">
      <label class="fw-bold">Type:</label><br />
      <Toggle v-model="one_time" offLabel="Recurring" onLabel="One-Off" />
    </div>

    <button class="btn btn-success w-100" :disabled="!start_time || !duration_min" @click="submit">Save</button>
  </div>
</template>

<script>
import Toggle from "@vueform/toggle";

export default {
  components: {
    Toggle,
  },
  data() {
    return {
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
      start_time: null,
      duration_min: null,
      one_time: false,
      days: [],
    };
  },
  methods: {
    toggleDay(i) {
      this.days.includes(i) ? (this.days = this.days.filter((d) => d !== i)) : this.days.push(i);
    },
    submit() {},
  },
};
</script>
