<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeIndex = ref('1')

const handleSelect = (key: string) => {
  if (key === '1') {
    router.push('/home/event')
  } else if (key === '2') {
    router.push('/home/music')
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="home-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">活动音乐管理系统</div>
          <el-menu
            :default-active="activeIndex"
            class="main-menu"
            mode="horizontal"
            @select="handleSelect"
          >
            <el-menu-item index="1">活动发布</el-menu-item>
            <el-menu-item index="2">音乐播放</el-menu-item>
          </el-menu>
          <div class="user-actions">
            <span v-if="authStore.user">{{ authStore.user.username }}</span>
            <el-button type="text" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </el-header>
      
      <el-main>
        <router-view />
      </el-main>
      
      <el-footer>
        <div class="footer-content">
          <p>© {{ new Date().getFullYear() }} 活动音乐管理系统</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<style scoped>
.home-container {
  height: 100%;
}

.el-container {
  height: 100%;
}

.el-header {
  background-color: #fff;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-right: 40px;
}

.main-menu {
  flex: 1;
}

.user-actions {
  display: flex;
  align-items: center;
}

.user-actions span {
  margin-right: 15px;
}

.el-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.el-footer {
  background-color: #fff;
  color: #999;
  text-align: center;
  padding: 20px;
  border-top: 1px solid #eee;
}

.footer-content {
  font-size: 14px;
}
</style>