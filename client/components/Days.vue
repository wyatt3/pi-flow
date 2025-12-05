<template>
  <div class="d-flex gap-2">
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
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
      days: this.modelValue,
    };
  },
  methods: {
    toggleDay(day) {
      if (this.days.includes(day)) {
        this.days = this.days.filter((d) => d !== day);
      } else {
        this.days.push(day);
      }
      this.$emit("update:modelValue", this.days);
    },
  },
};
</script>

<style scoped>
</style>
