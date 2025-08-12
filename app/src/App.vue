<template>
  <HelloWorld :msg="msg" />
  <button @click="handleHello">Click for hello</button>
  <button @click="handleGoodbye" class="margin-left">Click for goodbye</button>
</template>

<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { get as getHello } from "@/api/hello"; // TODO: fix lint error
import { ref } from "vue";

const msg = ref("Pulumi static");

const handleHello = async () => {
  const response = await getHello();
  msg.value = response.msg;
};

const handleGoodbye = async () => {
  msg.value = "mocked goodbye";
};
</script>

<style scoped>
.margin-left {
  margin-left: 1rem;
}
</style>
