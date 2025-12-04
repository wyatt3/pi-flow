<template>
  <modal :open="open" @toggle="$emit('close')">
    <h2>Add A Zone</h2>

    <label>Name</label>
    <input v-model="name" class="form-control mb-2" />

    <label>GPIO Pin</label>
    <input v-model="gpio_pin" type="number" class="form-control mb-2" />

    <button @click="submit" :disabled="!name || !gpio_pin || loading" class="btn btn-success w-100">
      <span v-if="loading" class="spinner-border"></span><span v-else>Add Zone</span>
    </button>
  </modal>
</template>

<script>
import Modal from "../Modal.vue";
export default {
  components: { Modal },
  props: {
    open: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["close"],
  data() {
    return {
      name: "",
      gpio_pin: null,
      loading: false,
    };
  },
  methods: {
    submit() {
      this.loading = true;
      axios
        .post("/api/relays", {
          name: this.name,
          gpio_pin: this.gpio_pin,
        })
        .then((response) => {
          this.close();
          this.$toast.success("Zone added");
        })
        .catch((err) => {
          this.$toast.error(err.response.data);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    close() {
      this.name = "";
      this.gpio_pin = null;
      this.$emit("close");
    },
  },
};
</script>
