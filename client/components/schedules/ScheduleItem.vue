<template>
  <div class="schedule">
    <button class="btn btn-danger delete-schedule bi bi-x" @click="deleteSchedule"></button>

    <ScheduleForm v-if="editing" v-model="localSchedule" :loading="loading" @submit="save" @cancel="editing = false" />
    <div v-else>
      <div class="d-flex flex-wrap justify-content-end">
        <div class="schedule-item start-time">
          <label class="fw-bold me-2">Start Time:</label>
          <span>{{ formattedTime }}</span>
        </div>

        <div class="schedule-item duration">
          <label class="fw-bold me-2">Duration:</label>
          <span>{{ localSchedule.duration_min }} minutes</span>
        </div>

        <div class="d-flex schedule-item days">
          <label class="fw-bold me-2">Days:</label>
          <div class="d-flex gap-2">
            <span
              class="day-box"
              :class="{ 'bg-info': localSchedule.days.includes(i) }"
              v-for="(day, i) in dayNames"
              :key="i"
            >
              {{ day }}
            </span>
          </div>
        </div>

        <div class="schedule-item type">
          <label class="fw-bold me-2">Type:</label>
          <span>{{ localSchedule.one_time ? "One-Off" : "Recurring" }}</span>
        </div>

        <div class="schedule-item status">
          <label class="fw-bold me-2">Status:</label>

          <span
            v-if="localSchedule.status !== 'running'"
            class="px-2 py-1 rounded text-uppercase bg-success text-white"
          >
            {{ localSchedule.status }}
          </span>

          <span v-else class="px-2 py-1 rounded text-uppercase bg-warning">
            Running -
            <Countdown :startTime="localSchedule.start_time" :durationMin="localSchedule.duration_min" />
          </span>
        </div>
      </div>

      <button
        @click="toggleSkipNext"
        class="w-100 mt-3 btn"
        :class="localSchedule.skip_next ? 'btn-danger' : 'btn-warning'"
      >
        <i class="bi" :class="localSchedule.skip_next ? 'bi-skip-backward-fill' : 'bi-skip-forward-fill'"></i>
        {{ localSchedule.skip_next ? "Unskip Next Occurrence" : "Skip Next Occurrence" }}
      </button>
      <button @click="editing = true" class="w-100 mt-3 btn btn btn-outline-dark">
        <i class="bi bi-pencil"></i> Edit Schedule
      </button>
    </div>
  </div>
</template>

<script>
import Countdown from "../Countdown.vue";
import Days from "../Days.vue";
import ScheduleForm from "./ScheduleForm.vue";
import Toggle from "@vueform/toggle";
export default {
  components: {
    Countdown,
    Days,
    ScheduleForm,
    Toggle,
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      editing: false,
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
    };
  },
  computed: {
    localSchedule: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
    formattedTime() {
      const [H, M] = this.localSchedule.start_time.split(":");
      return `${H % 12 == 0 ? 12 : H % 12}:${M} ${H < 12 ? "AM" : "PM"}`;
    },
  },
  methods: {
    save() {},
    toggleSkipNext() {
      this.localSchedule.skip_next = this.localSchedule.skip_next == 1 ? 0 : 1;
      axios.post(`/api/schedules/${this.localSchedule.id}`, this.localSchedule).catch((err) => {
        this.localSchedule.skip_next = this.localSchedule.skip_next == 1 ? 0 : 1;
        this.$toast.error(err.response.data);
      });
    },
    deleteSchedule() {
      axios
        .delete(`/api/schedules/${this.localSchedule.id}`)
        .then(() => {
          this.$toast.success("Schedule deleted");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        });
    },
  },
};
</script>
