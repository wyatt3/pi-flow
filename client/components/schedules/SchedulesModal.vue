<template>
  <Modal :open="zone != null" @toggle="close">
    <h1>Schedules</h1>

    <ScheduleList :adding-schedule="addingSchedule" :zone="zone" />

    <NewSchedule ref="newSchedule" :zone="zone" :adding-schedule="addingSchedule" @off="addingSchedule = false" />
    <button v-if="!addingSchedule" class="btn btn-success w-100 mt-3" @click="addingSchedule = true">
      Add New Schedule
    </button>
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
  methods: {
    close() {
      this.$emit("close");
      this.$refs.newSchedule.reset();
    },
  },
};
</script>
