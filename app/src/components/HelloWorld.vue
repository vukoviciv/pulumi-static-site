<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <p>Testis testis</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ msg: string }>();
</script>
