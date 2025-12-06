<template>
  <div class="d-flex gap-2">
    <template v-for="(day, i) in dayNames" :key="i">
      <span v-if="readOnly" class="day" :class="{ 'bg-info': days.includes(i) }">
        {{ day }}
      </span>
      <button
        v-else
        @click="toggleDay(i)"
        class="day btn day-btn"
        :class="{ 'btn-info': days.includes(i), 'btn-outline-dark': !days.includes(i) }"
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

<style scoped>
.day {
  width: 27px;
  height: 27px;
  padding: 0;
  border-radius: 5px;
  text-align: center;
}
.day:not(.bg-info):not(.btn-info) {
  border: 1px solid var(--bs-dark);
}
</style>
