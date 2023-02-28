<script lang="ts" setup>
const data = await $fetch('/api/hello')
</script>

<template>
  <div class="p-4 font-bold underline underline-current cursor-pointer">
    My first Nuxt3 App {{ data.data.message }}
  </div>
</template>
