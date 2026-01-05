<template>
  <Modal :open="zone != null" @toggle="close">
    <div class="modal-header-pf">
      <div>
        <h2>Schedules</h2>
        <p v-if="zone" class="zone-name">{{ zone.name }}</p>
      </div>
      <button class="modal-close-btn" @click="close">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <ScheduleList :adding-schedule="addingSchedule" :zone="zone" />

    <div class="schedule-actions">
      <ScheduleForm
        v-if="addingSchedule"
        v-model="newSchedule"
        :loading="loading"
        @submit="saveNewSchedule"
        @cancel="addingSchedule = false"
      />
      <button
        v-else
        class="btn-pf btn-pf-success btn-pf-lg add-schedule-btn"
        @click="addingSchedule = true"
      >
        <i class="bi bi-plus-lg"></i>
        Add New Schedule
      </button>
    </div>
  </Modal>
</template>

<script>
import Modal from "../Modal.vue";
import ScheduleForm from "./ScheduleForm.vue";
import ScheduleList from "./ScheduleList.vue";
export default {
  components: {
    Modal,
    ScheduleForm,
    ScheduleList,
  },
  props: {
    zone: {
      type: Object,
      required: false,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      addingSchedule: false,
      newSchedule: {
        start_time: null,
        duration_min: null,
        one_time: false,
        days: [],
      },
    };
  },
  methods: {
    saveNewSchedule() {
      this.loading = true;
      axios
        .post(`/api/schedules`, {
          zone_id: this.zone.id,
          ...this.newSchedule,
        })
        .then(() => {
          this.addingSchedule = false;
          this.newSchedule = {
            start_time: null,
            duration_min: null,
            one_time: false,
            days: [],
          };
          this.$toast.success("Schedule created");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    close() {
      this.$emit("close");
      this.addingSchedule = false;
      this.newSchedule = {
        start_time: null,
        duration_min: null,
        one_time: false,
        days: [],
      };
    },
  },
};
</script>

<style scoped>
.zone-name {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--pf-text-muted);
}

.schedule-actions {
  margin-top: 1.5rem;
}

.add-schedule-btn {
  width: 100%;
}
</style>
