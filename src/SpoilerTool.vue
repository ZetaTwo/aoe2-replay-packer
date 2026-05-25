<script setup lang="ts">
import SpoilerInstructions from '@/components/spoilers/SpoilerInstructions.vue'
import SpoilerForm from '@/components/spoilers/SpoilerForm.vue'
import AppFooter from '@/components/common/AppFooter.vue'
</script>

<template>
  <div class="container">
    <main :class="$style.main">
      <SpoilerInstructions />
      <SpoilerForm />
    </main>
    <AppFooter />
  </div>
</template>

<style module>
.main {
  margin-top: var(--space-10);
}
</style>
