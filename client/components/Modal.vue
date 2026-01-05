<template>
  <transition name="modal">
    <div class="modal-overlay" v-if="open" @click.self="toggle">
      <div class="modal-container">
        <slot></slot>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: "Modal",
  props: {
    open: {
      required: true,
    },
  },
  emits: ["toggle"],
  methods: {
    toggle() {
      this.$emit("toggle");
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-container {
  background: var(--pf-card);
  border-radius: var(--pf-radius-xl);
  box-shadow: var(--pf-shadow-xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
}

/* Transition animations */
.modal-enter-active {
  transition: opacity 0.25s ease;
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-leave-active .modal-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
