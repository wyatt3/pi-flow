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
        <tr v-for="relay in relays" :key="relay.id">
          <td>{{ relay.name }}</td>
          <td>{{ relay.gpio_pin }}</td>
          <td>
            <button class="btn btn-info" @click="selectedRelay = relay"><i class="bi bi-clock"></i></button>
          </td>
          <td>
            <button
              @click="toggleRelayActive(relay)"
              class="btn"
              :disabled="relay.schedules.filter((schedule) => schedule.status === 'running').length > 0"
              :class="relay.active == 1 ? 'btn-danger' : 'btn-success'"
            >
              {{ relay.active == 1 ? "OFF" : "ON" }}
              <div v-if="relay.schedules.filter((schedule) => schedule.status === 'running').length > 0">
                <i class="bi bi-alarm"></i>
                <Countdown
                  :startTime="relay.schedules.filter((schedule) => schedule.status === 'running')[0].start_time"
                  :durationMin="relay.schedules.filter((schedule) => schedule.status === 'running')[0].duration_min"
                />
              </div>
            </button>
          </td>
          <td>
            <button class="btn btn-danger bi bi-trash" @click="deleteRelay(relay)"></button>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="btn btn-primary w-100 mt-3" @click="addingRelay = true"><i class="bi bi-plus"></i>Add Zone</button>
    <modal :open="addingRelay" @toggle="addingRelay = false">
      <h2>Add A Zone</h2>
      <label>Name</label>
      <input v-model="newRelayName" type="text" placeholder="Zone Name" class="form-control mb-2" />
      <label>GPIO Pin</label>
      <input v-model="newRelayGpioPin" type="number" placeholder="GPIO Pin" class="form-control mb-2" />
      <button @click="addRelay" :disabled="!newRelayName || !newRelayGpioPin || loading" class="btn btn-success w-100">
        <span v-if="loading" class="spinner-border"></span><span v-else>Add Zone</span>
      </button>
    </modal>

    <modal
      :open="selectedRelay"
      @toggle="
        resetNewSchedule();
        selectedRelay = null;
      "
    >
      <h1>Schedules</h1>
      <div v-if="!addingSchedule && selectedRelay.schedules.length == 0" class="schedule p-3 mb-3 text-center">
        No schedules
      </div>
      <div class="schedule p-3 mb-3 position-relative" v-for="schedule in selectedRelay.schedules" :key="schedule.id">
        <div v-if="schedule.editing"></div>
        <div v-else>
          <button class="btn btn-danger delete-schedule bi bi-x" @click="deleteSchedule(schedule)"></button>
          <div class="d-flex flex-wrap justify-content-end">
            <div class="schedule-item start-time">
              <label class="fw-bold me-2">Start Time: </label>
              <span>{{ convertTime(schedule.start_time) }}</span>
            </div>
            <div class="schedule-item duration">
              <label class="fw-bold me-2">Duration: </label>
              <span>{{ schedule.duration_min }} minute{{ schedule.duration_min > 1 ? "s" : "" }}</span>
            </div>
            <div class="d-flex schedule-item days">
              <label class="fw-bold me-2">Days: </label>
              <div class="d-flex gap-2">
                <span
                  class="day-box"
                  :class="{ 'bg-info': schedule.days.includes(dayNumber) }"
                  v-for="(day, dayNumber) in dayNames"
                  :key="dayNumber"
                  >{{ day }}
                </span>
              </div>
            </div>
            <div class="schedule-item type">
              <label class="fw-bold me-2">Type: </label>
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
          <button
            @click="toggleSkipNext(schedule)"
            class="w-100 mt-3 btn btn-warning"
            :class="{ 'btn-danger': schedule.skip_next }"
          >
            <i class="bi" :class="schedule.skip_next ? 'bi-skip-backward-fill' : 'bi-skip-forward-fill'"></i>
            {{ schedule.skip_next ? "Unskip Next Occurrence" : "Skip Next Occurrence" }}
          </button>
          <button @click="schedule.editing = true" class="w-100 mt-3 btn btn btn-outline-dark">
            <i class="bi bi-pencil"></i> Edit Schedule
          </button>
        </div>
      </div>
      <div class="schedule p-3" v-if="addingSchedule">
        <label class="fw-bold">Start Time: </label>
        <input v-model="newSchedule.start_time" type="time" class="form-control mb-2" />
        <label class="fw-bold">Duration: </label>
        <div class="input-group mb-2">
          <input v-model="newSchedule.duration_min" type="number" class="form-control" />
          <span class="input-group-text">minutes</span>
        </div>
        <label class="fw-bold">Days:</label>
        <div class="d-flex gap-2 mb-2">
          <div v-for="(day, dayNumber) in dayNames" :key="day">
            <button
              @click="toggleDay(newSchedule, dayNumber)"
              class="day-btn btn"
              :class="{ 'btn-info': newSchedule.days.includes(dayNumber) }"
            >
              {{ day }}
            </button>
          </div>
        </div>
        <div class="mb-2">
          <label class="fw-bold">Type: </label>
          <br />
          <Toggle class="mb-2 mt-1 ms-2" v-model="newSchedule.one_time" offLabel="Recurring" onLabel="One-Off" />
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-danger w-50" @click="resetNewSchedule">Cancel</button>
          <button
            class="btn btn-success w-50"
            @click="createSchedule"
            :disabled="!newSchedule.start_time || !newSchedule.duration_min || loading"
          >
            <span v-if="loading" class="spinner-border"></span><span v-else>Save</span>
          </button>
        </div>
      </div>
      <button v-else class="btn btn-success w-100 mt-3" @click="addingSchedule = true">Add New Schedule</button>
    </modal>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import Countdown from "./components/Countdown.vue";
import Modal from "./components/Modal.vue";
import Toggle from "@vueform/toggle";
export default {
  components: {
    Countdown,
    Modal,
    Toggle,
  },
  name: "App",

  data() {
    return {
      loading: false,
      relays: [],
      schedules: [],
      connected: false,
      socket: null,
      newRelayName: "",
      newRelayGpioPin: null,
      addingRelay: false,
      selectedRelay: null,
      addingSchedule: false,
      newSchedule: {
        start_time: null,
        duration_min: null,
        one_time: false,
        days: [],
      },
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
    };
  },

  methods: {
    connectWs() {
      this.socket = io(`http://${window.location.hostname}:${import.meta.env.VITE_WS_PORT}`);

      this.socket.on("update", (relays) => {
        this.relays = relays;
        if (this.selectedRelay) {
          this.selectedRelay = this.relays.find((relay) => relay.id == this.selectedRelay.id);
        }
      });
    },
    getRelays() {
      axios.get("/api/relays").then((response) => {
        this.relays = response.data;
      });
    },
    addRelay() {
      this.loading = true;
      axios
        .post("/api/relays", {
          name: this.newRelayName,
          gpio_pin: this.newRelayGpioPin,
        })
        .then((response) => {
          this.newRelayName = "";
          this.newRelayGpioPin = null;
          this.addingRelay = false;
          this.$toast.success("Zone added");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    toggleRelayActive(relay) {
      relay.active = relay.active == 1 ? 0 : 1;
      axios.post(`/api/relays/${relay.id}`, relay).catch((err) => {
        relay.active = relay.active == 1 ? 0 : 1;
        this.$toast.error(err.response.data);
      });
    },
    deleteRelay(relay) {
      axios.delete(`/api/relays/${relay.id}`).then(() => {
        this.$toast.success("Zone deleted");
      });
    },

    createSchedule() {
      this.loading = true;
      axios
        .post(`/api/schedules`, {
          relay_id: this.selectedRelay.id,
          ...this.newSchedule,
        })
        .then(() => {
          this.newSchedule = {
            start_time: null,
            duration_min: null,
            one_time: false,
            days: [],
          };
          this.addingSchedule = false;
          this.$toast.success("Schedule created");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    resetNewSchedule() {
      this.newSchedule = {
        start_time: null,
        duration_min: null,
        one_time: false,
        days: [],
      };
      this.addingSchedule = false;
    },
    toggleSkipNext(schedule) {
      schedule.skip_next = schedule.skip_next == 1 ? 0 : 1;
      axios.post(`/api/schedules/${schedule.id}`, schedule).catch((err) => {
        schedule.skip_next = schedule.skip_next == 1 ? 0 : 1;
        this.$toast.error(err.response.data);
      });
    },
    updateSchedule() {},
    deleteSchedule(schedule) {
      axios
        .delete(`/api/schedules/${schedule.id}`)
        .then(() => {
          this.$toast.success("Schedule deleted");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        });
    },

    toggleDay(schedule, day) {
      if (schedule.days.includes(day)) {
        schedule.days = schedule.days.filter((d) => d !== day);
      } else {
        schedule.days.push(day);
      }
    },

    convertTime(time) {
      const [H, M] = time.split(":");
      return `${H % 12}:${M} ${H < 12 ? "AM" : "PM"}`;
    },
  },

  mounted() {
    this.connectWs();
    this.getRelays();
  },

  beforeUnmount() {
    if (this.socket) this.socket.close();
  },
};
</script>
