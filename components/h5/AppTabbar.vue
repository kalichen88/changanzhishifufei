<script setup lang="ts">
const route = useRoute()
const active = computed(() => {
  if (route.path.startsWith('/cat')) return 'cat'
  if (route.path.startsWith('/buy')) return 'buy'
  return 'home'
})
</script>

<template>
  <van-tabbar v-model="active" class="h5-tabbar" route>
    <van-tabbar-item replace name="home" to="/list" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item replace name="cat" to="/cat" icon="apps-o">分类</van-tabbar-item>
    <van-tabbar-item replace name="buy" to="/buy" icon="shopping-cart-o">已购</van-tabbar-item>
  </van-tabbar>
</template>
