<template>
  <div class="schedule">
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
      <button class="btn btn-danger w-50" @click="$emit('cancel')">Cancel</button>
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
    modelValue: {
      type: Object,
      required: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      start_time: this.modelValue.start_time,
      duration_min: this.modelValue.duration_min,
      days: this.modelValue.days,
      one_time: this.modelValue.one_time,
    };
  },
  methods: {
    submit() {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        start_time: this.start_time,
        duration_min: this.duration_min,
        days: this.days,
        one_time: this.one_time,
      });
      this.$emit("submit");
    },
  },
};
</script>

<style scoped>
</style>
