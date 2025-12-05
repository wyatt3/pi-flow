<template>
  <Modal :open="zone != null" @toggle="close">
    <h1>Schedules</h1>

    <ScheduleList :adding-schedule="addingSchedule" :zone="zone" />

    <ScheduleForm
      v-if="addingSchedule"
      v-model="newSchedule"
      :loading="loading"
      @submit="saveNewSchedule"
      @cancel="addingSchedule = false"
    />
    <button v-if="!addingSchedule" class="btn btn-success w-100 mt-3" @click="addingSchedule = true">
      Add New Schedule
    </button>
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
