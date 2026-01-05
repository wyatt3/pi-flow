<template>
  <Modal :open="open" @toggle="$emit('close')">
    <div class="modal-header-pf">
      <h2>Add New Zone</h2>
      <button class="modal-close-btn" @click="$emit('close')">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <div class="form-group">
      <label class="form-label-pf">Zone Name</label>
      <input
        v-model="name"
        class="form-input-pf"
        placeholder="e.g., Front Lawn"
      />
    </div>

    <div class="form-group">
      <label class="form-label-pf">GPIO Pin</label>
      <input
        v-model="gpio_pin"
        type="number"
        class="form-input-pf"
        placeholder="e.g., 17"
      />
    </div>

    <div class="form-actions">
      <button class="btn-pf btn-pf-outline" @click="$emit('close')">
        Cancel
      </button>
      <button
        @click="submit"
        :disabled="!name || !gpio_pin || loading"
        class="btn-pf btn-pf-success"
      >
        <span v-if="loading" class="spinner-pf"></span>
        <template v-else>
          <i class="bi bi-plus-lg"></i>
          Add Zone
        </template>
      </button>
    </div>
  </Modal>
</template>

<script>
import Modal from "../Modal.vue";
export default {
  components: {
    Modal,
  },
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
        .post("/api/zones", {
          name: this.name,
          gpio_pin: this.gpio_pin,
        })
        .then(() => {
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

<style scoped>
.form-group {
  margin-bottom: 1.25rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.form-actions .btn-pf {
  flex: 1;
}
</style>
