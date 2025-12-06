<template>
  <transition name="modal-fade">
    <div class="modal-container" v-if="open">
      <div class="background" @click="toggle"></div>
      <div class="modal-body text-dark">
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
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}
.modal-body {
  padding: 20px;
  max-height: 85%;
  overflow-y: auto;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  max-width: 700px;
  border-radius: 10px;
  background-color: #fff;
  z-index: 101;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 100%;
}

.modal-fade-enter-active .background,
.modal-fade-enter-active .modal-body,
.modal-fade-leave-active .background,
.modal-fade-leave-active .modal-body {
  transition: opacity 0.2s;
}

.modal-fade-enter-from .background,
.modal-fade-enter-from .modal-body,
.modal-fade-leave-to .background,
.modal-fade-leave-to .modal-body {
  opacity: 0;
}
</style>
