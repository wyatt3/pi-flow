<template>
  <div class="day-selector">
    <template v-for="(day, i) in dayNames" :key="i">
      <span
        v-if="readOnly"
        class="day-btn"
        :class="{ 'is-active': days.includes(i), 'is-readonly': true }"
      >
        {{ day }}
      </span>
      <button
        v-else
        @click="toggleDay(i)"
        class="day-btn"
        :class="{ 'is-active': days.includes(i) }"
        type="button"
      >
        {{ day }}
      </button>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
    readOnly: {
      type: Boolean,
      default: false,
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
