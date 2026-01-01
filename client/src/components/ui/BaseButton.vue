<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost'].includes(value)
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button 
    :class="['base-button', `variant-${variant}`]" 
    :type="type" 
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.variant-primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1);
}
.variant-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}
.variant-primary:active:not(:disabled) {
  transform: translateY(0);
}

.variant-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.variant-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.variant-danger {
  background: #ef4444;
  color: white;
}
.variant-danger:hover:not(:disabled) {
  background: #dc2626;
}

.variant-ghost {
  background: transparent;
  color: var(--color-text-muted);
}
.variant-ghost:hover:not(:disabled) {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.05);
}
</style>
