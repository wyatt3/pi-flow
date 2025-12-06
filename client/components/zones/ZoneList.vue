<template>
  <div>
    <h1 class="text-xl font-bold">Zones</h1>
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>GPIO Pin</th>
          <th>Schedule</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <ZoneRow v-for="zone in zones" :key="zone.id" :zone="zone" @select-zone="$emit('select-zone', $event)" />
      </tbody>
    </table>

    <button class="btn btn-primary w-100 mt-3" @click="$emit('add-zone')"><i class="bi bi-plus"></i> Add Zone</button>
  </div>
</template>

<script>
import ZoneRow from "./ZoneRow.vue";
export default {
  components: {
    ZoneRow,
  },
  props: {
    zones: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
th {
  text-align: center;
}
</style>
