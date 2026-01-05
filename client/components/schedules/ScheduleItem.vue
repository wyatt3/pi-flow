<template>
  <ScheduleForm
    v-if="editing"
    v-model="localSchedule"
    :loading="loading"
    @submit="save"
    @cancel="editing = false"
  />
  <div v-else class="schedule-card" :class="{ 'is-running': schedule.status === 'running' }">
    <div class="schedule-header">
      <div class="schedule-time">
        <i class="bi bi-clock"></i>
        <span class="time-value">{{ formattedTime }}</span>
      </div>
      <button
        class="btn-pf btn-pf-ghost btn-pf-icon delete-btn"
        @click="deleteSchedule"
        title="Delete schedule"
      >
        <i class="bi bi-trash"></i>
      </button>
    </div>

    <div class="schedule-details">
      <div class="detail-row">
        <div class="detail-item">
          <span class="detail-label">Duration</span>
          <span class="detail-value">{{ schedule.duration_min }} min</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Type</span>
          <span class="badge-pf" :class="schedule.one_time ? 'badge-pf-info' : 'badge-pf-muted'">
            {{ schedule.one_time ? "One-Off" : "Recurring" }}
          </span>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-item">
          <span class="detail-label">Days</span>
          <Days v-model="schedule.days" read-only />
        </div>
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span v-if="schedule.status === 'running'" class="badge-pf badge-pf-warning">
            <Countdown :startTime="schedule.start_time" :durationMin="schedule.duration_min" />
          </span>
          <span v-else class="badge-pf badge-pf-success">
            {{ schedule.status }}
          </span>
        </div>
      </div>
    </div>

    <div class="schedule-actions">
      <button
        @click="toggleSkipNext"
        class="btn-pf btn-pf-sm"
        :class="schedule.skip_next ? 'btn-pf-danger' : 'btn-pf-warning'"
      >
        <i class="bi" :class="schedule.skip_next ? 'bi-skip-backward-fill' : 'bi-skip-forward-fill'"></i>
        {{ schedule.skip_next ? "Unskip" : "Skip Next" }}
      </button>
      <button @click="editing = true" class="btn-pf btn-pf-outline btn-pf-sm">
        <i class="bi bi-pencil"></i>
        Edit
      </button>
    </div>
  </div>
</template>

<script>
import Countdown from "../Countdown.vue";
import Days from "../Days.vue";
import ScheduleForm from "./ScheduleForm.vue";
export default {
  components: {
    Countdown,
    Days,
    ScheduleForm,
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
      if (confirm("Are you sure you want to delete this schedule?")) {
        axios
          .delete(`/api/schedules/${this.schedule.id}`)
          .then(() => {
            this.$toast.success("Schedule deleted");
          })
          .catch((err) => {
            this.$toast.error(err.response.data);
          });
      }
    },
  },
};
</script>

<style scoped>
.schedule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--pf-border);
}

.schedule-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--pf-text);
}

.schedule-time i {
  color: var(--pf-primary);
}

.time-value {
  font-size: 1.125rem;
  font-weight: 600;
}

.delete-btn {
  opacity: 0.5;
  transition: opacity var(--pf-transition);
}

.schedule-card:hover .delete-btn {
  opacity: 1;
}

.schedule-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--pf-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.detail-value {
  font-weight: 500;
  color: var(--pf-text);
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--pf-border);
}

.schedule-actions .btn-pf {
  flex: 1;
}

@media (max-width: 480px) {
  .detail-row {
    grid-template-columns: 1fr;
  }
}
</style>
