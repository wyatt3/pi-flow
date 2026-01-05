<template>
  <span class="countdown-display">
    <i class="bi bi-clock"></i>
    {{ remaining }}
  </span>
</template>

<script>
export default {
  props: {
    startTime: String,
    durationMin: Number,
  },

  data() {
    return {
      remaining: "",
      timer: null,
    };
  },

  mounted() {
    this.update();
    this.timer = setInterval(this.update, 1000);
  },

  beforeUnmount() {
    clearInterval(this.timer);
  },

  methods: {
    getTodayTimestamp(timeStr) {
      const [H, M] = timeStr.split(":").map(Number);
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), H, M, 0).getTime();
    },

    update() {
      const startTs = this.getTodayTimestamp(this.startTime);
      const endTs = startTs + this.durationMin * 60 * 1000;
      const diff = endTs - Date.now();

      if (diff <= 0) {
        this.remaining = "00:00";
        clearInterval(this.timer);
        return;
      }

      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);

      this.remaining = String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
    },
  },
};
</script>
