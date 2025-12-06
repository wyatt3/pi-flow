<template>
  <div>
    <ZoneList :zones="zones" @add-zone="addingZone = true" @select-zone="selectedZone = $event" />
    <NewZone :open="addingZone" @close="addingZone = false" />
    <SchedulesModal :zone="selectedZone" @close="selectedZone = null" />
  </div>
</template>

<script>
import { io } from "socket.io-client";
import NewZone from "./components/zones/NewZone.vue";
import SchedulesModal from "./components/schedules/SchedulesModal.vue";
import ZoneList from "./components/zones/ZoneList.vue";
export default {
  components: {
    NewZone,
    SchedulesModal,
    ZoneList,
  },
  name: "App",

  data() {
    return {
      zones: [],
      socket: null,
      addingZone: false,
      selectedZone: null,
    };
  },

  methods: {
    connectWs() {
      this.socket = io(`http://${window.location.hostname}:${import.meta.env.VITE_WS_PORT}`);

      this.socket.on("update", (zones) => {
        this.zones = zones;
        if (this.selectedZone) {
          this.selectedZone = this.zones.find((zone) => zone.id == this.selectedZone.id);
        }
      });
    },
    getZones() {
      axios.get("/api/zones").then((response) => {
        this.zones = response.data;
      });
    },
  },

  mounted() {
    this.connectWs();
    this.getZones();
  },

  beforeUnmount() {
    if (this.socket) this.socket.close();
  },
};
</script>
