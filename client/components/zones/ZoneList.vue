<template>
  <div>
    <div class="page-header">
      <h1>Zones</h1>
      <button class="btn-pf btn-pf-primary" @click="$emit('add-zone')">
        <i class="bi bi-plus-lg"></i>
        Add Zone
      </button>
    </div>

    <div v-if="zones.length === 0" class="empty-state">
      <i class="bi bi-droplet"></i>
      <h3>No zones yet</h3>
      <p>Add your first zone to get started with scheduling.</p>
    </div>

    <div v-else class="zone-grid">
      <ZoneCard
        v-for="zone in zones"
        :key="zone.id"
        :zone="zone"
        @select-zone="$emit('select-zone', $event)"
      />
    </div>
  </div>
</template>

<script>
import ZoneCard from "./ZoneCard.vue";
export default {
  components: {
    ZoneCard,
  },
  props: {
    zones: {
      type: Array,
      required: true,
    },
  },
};
</script>
