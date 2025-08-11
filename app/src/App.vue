<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
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

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
