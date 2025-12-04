<template>
  <Modal :open="zone != null" @toggle="$emit('close')">
    <h1>Schedules</h1>

    <ScheduleList :zone="zone" />

    <NewSchedule v-if="addingSchedule" />
    <button v-else class="btn btn-success w-100 mt-3" @click="addingSchedule = true">Add New Schedule</button>
  </Modal>
</template>

<script>
import Modal from "../Modal.vue";
import NewSchedule from "./NewSchedule.vue";
import ScheduleList from "./ScheduleList.vue";

export default {
  components: {
    Modal,
    NewSchedule,
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
      addingSchedule: false,
    };
  },
};
</script>
