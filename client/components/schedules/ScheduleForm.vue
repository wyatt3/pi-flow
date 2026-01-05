<template>
  <div class="schedule-card schedule-form">
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label-pf">Start Time</label>
        <input v-model="start_time" type="time" class="form-input-pf" />
      </div>

      <div class="form-group">
        <label class="form-label-pf">Duration</label>
        <div class="input-group-pf">
          <input v-model="duration_min" type="number" class="form-input-pf" placeholder="30" />
          <span class="input-addon">min</span>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label-pf">Days</label>
      <Days v-model="days" />
    </div>

    <div class="form-group">
      <label class="form-label-pf">Schedule Type</label>
      <div class="type-toggle">
        <Toggle v-model="one_time" offLabel="Recurring" onLabel="One-Off" />
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-pf btn-pf-outline" @click="$emit('cancel')">
        Cancel
      </button>
      <button
        class="btn-pf btn-pf-success"
        @click="submit"
        :disabled="!start_time || !duration_min || loading"
      >
        <span v-if="loading" class="spinner-pf"></span>
        <template v-else>
          <i class="bi bi-check-lg"></i>
          Save
        </template>
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
.schedule-form {
  background: var(--pf-bg);
  border-style: dashed;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.type-toggle {
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--pf-border-dark);
}

.form-actions .btn-pf {
  flex: 1;
}

@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
