<template>
  <HelloWorld :msg="msg" />
  <button @click="handleHello">Click for hello</button>
  <button @click="handleGoodbye" class="margin-left">Click for goodbye</button>
</template>

<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { get as getHello } from "@/api/hello";
import { get as getGoodbye } from "@/api/goodbye";
import { ref } from "vue";

const msg = ref("Klikni, aj klikni");

const handleHello = async () => {
  const response = await getHello();
  msg.value = response.msg;
};

const handleGoodbye = async () => {
  const response = await getGoodbye();
  msg.value = response.msg;
};
</script>

<style scoped>
.margin-left {
  margin-left: 1rem;
}
</style>
