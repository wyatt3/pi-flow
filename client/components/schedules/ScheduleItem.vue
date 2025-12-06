<template>
  <ScheduleForm v-if="editing" v-model="localSchedule" :loading="loading" @submit="save" @cancel="editing = false" />
  <div v-else class="schedule">
    <button class="btn btn-danger delete-schedule bi bi-x" @click="deleteSchedule"></button>
    <div class="d-flex flex-wrap justify-content-end">
      <div class="schedule-item start-time">
        <label class="fw-bold me-2">Start Time:</label>
        <span>{{ formattedTime }}</span>
      </div>

      <div class="schedule-item duration">
        <label class="fw-bold me-2">Duration:</label>
        <span>{{ schedule.duration_min }} minutes</span>
      </div>

      <div class="d-flex schedule-item days">
        <label class="fw-bold me-2">Days:</label>
        <Days v-model="schedule.days" read-only />
      </div>

      <div class="schedule-item type">
        <label class="fw-bold me-2">Type:</label>
        <span>{{ schedule.one_time ? "One-Off" : "Recurring" }}</span>
      </div>

      <div class="schedule-item status">
        <label class="fw-bold me-2">Status:</label>

        <span v-if="schedule.status !== 'running'" class="px-2 py-1 rounded text-uppercase bg-success text-white">
          {{ schedule.status }}
        </span>

        <span v-else class="px-2 py-1 rounded text-uppercase bg-warning">
          Running -
          <Countdown :startTime="schedule.start_time" :durationMin="schedule.duration_min" />
        </span>
      </div>
    </div>

    <button @click="toggleSkipNext" class="w-100 mt-3 btn" :class="schedule.skip_next ? 'btn-danger' : 'btn-warning'">
      <i class="bi" :class="schedule.skip_next ? 'bi-skip-backward-fill' : 'bi-skip-forward-fill'"></i>
      {{ schedule.skip_next ? "Unskip Next Occurrence" : "Skip Next Occurrence" }}
    </button>
    <button @click="editing = true" class="w-100 mt-3 btn btn btn-outline-dark">
      <i class="bi bi-pencil"></i> Edit Schedule
    </button>
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
    schedule: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      editing: false,
    };
  },
  computed: {
    localSchedule: {
      get() {
        return this.schedule;
      },
      set(value) {
        this.schedule.start_time = value.start_time;
        this.schedule.duration_min = value.duration_min;
        this.schedule.one_time = value.one_time;
        this.schedule.days = value.days;
      },
    },
    formattedTime() {
      const [H, M] = this.schedule.start_time.split(":");
      return `${H % 12 == 0 ? 12 : H % 12}:${M} ${H < 12 ? "AM" : "PM"}`;
    },
  },
  methods: {
    save() {
      this.loading = true;
      axios
        .post(`/api/schedules/${this.schedule.id}`, this.schedule)
        .then(() => {
          this.editing = false;
          this.$toast.success("Schedule updated");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    toggleSkipNext() {
      this.schedule.skip_next = this.schedule.skip_next == 1 ? 0 : 1;
      axios.post(`/api/schedules/${this.schedule.id}`, this.schedule).catch((err) => {
        this.schedule.skip_next = this.schedule.skip_next == 1 ? 0 : 1;
        this.$toast.error(err.response.data);
      });
    },
    deleteSchedule() {
      axios
        .delete(`/api/schedules/${this.schedule.id}`)
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

<style scoped>
.schedule-item {
  width: 100%;
  display: flex;
  align-items: center;
}

.delete-schedule {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  padding: 0;
}

@media screen and (min-width: 600px) {
  .start-time {
    order: 1;
  }

  .duration {
    order: 3;
  }

  .days {
    order: 2;
  }

  .type {
    order: 4;
  }

  .status {
    order: 5;
  }

  .schedule-item {
    width: 50%;
  }
}
</style>
