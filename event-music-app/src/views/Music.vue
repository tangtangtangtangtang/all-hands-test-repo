<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMusicStore, Song } from '../store/music'

const musicStore = useMusicStore()
const audioRef = ref<HTMLAudioElement | null>(null)
const transitionAudioRef = ref<HTMLAudioElement | null>(null)
const uploadRef = ref<HTMLInputElement | null>(null)
const transitionSongFile = ref<File | null>(null)
const transitionSongName = ref('')
const progress = ref(0)
const currentTime = ref('00:00')
const duration = ref('00:00')
const volume = ref(50)

// Computed properties
const currentSong = computed(() => musicStore.currentSong)
const isPlaying = computed(() => musicStore.isPlaying)
const shuffleMode = computed(() => musicStore.shuffleMode)
const songs = computed(() => musicStore.songs)

// Format time (seconds to MM:SS)
const formatTime = (time: number): string => {
  if (isNaN(time)) return '00:00'
  
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Handle audio time update
const handleTimeUpdate = () => {
  if (!audioRef.value) return
  
  const current = audioRef.value.currentTime
  const total = audioRef.value.duration
  
  progress.value = (current / total) * 100
  currentTime.value = formatTime(current)
}

// Handle audio loaded metadata
const handleLoadedMetadata = () => {
  if (!audioRef.value) return
  
  duration.value = formatTime(audioRef.value.duration)
}

// Handle audio ended
const handleEnded = () => {
  musicStore.playNext()
}

// Handle progress bar click
const handleProgressClick = (e: MouseEvent) => {
  if (!audioRef.value) return
  
  const progressBar = e.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const width = rect.width
  
  const percentage = offsetX / width
  const newTime = percentage * audioRef.value.duration
  
  audioRef.value.currentTime = newTime
}

// Handle volume change
const handleVolumeChange = (newVolume: number) => {
  volume.value = newVolume
  
  if (audioRef.value) {
    audioRef.value.volume = newVolume / 100
  }
  
  if (transitionAudioRef.value) {
    transitionAudioRef.value.volume = newVolume / 100
  }
}

// Handle play/pause
const togglePlay = () => {
  if (isPlaying.value) {
    musicStore.pause()
    audioRef.value?.pause()
  } else {
    musicStore.play()
    audioRef.value?.play()
  }
}

// Handle next song
const playNext = () => {
  musicStore.playNext()
}

// Handle shuffle toggle
const toggleShuffle = () => {
  musicStore.toggleShuffle()
}

// Handle file upload
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    
    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        musicStore.addSong(file)
      }
    })
    
    // Reset input
    if (uploadRef.value) {
      uploadRef.value.value = ''
    }
    
    ElMessage.success(`已添加 ${files.length} 首歌曲`)
  }
}

// Handle transition song upload
const handleTransitionSongUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    
    if (file.type.startsWith('audio/')) {
      transitionSongFile.value = file
      transitionSongName.value = file.name
      
      // Create a song object for the transition
      const url = URL.createObjectURL(file)
      const transitionSong: Song = {
        id: 'transition',
        name: file.name,
        file,
        url
      }
      
      // Set as transition song
      musicStore.setTransitionSong(transitionSong)
      
      ElMessage.success('已设置衔接音乐')
    } else {
      ElMessage.error('请上传音频文件')
    }
    
    // Reset input
    target.value = ''
  }
}

// Remove transition song
const removeTransitionSong = () => {
  transitionSongFile.value = null
  transitionSongName.value = ''
  musicStore.setTransitionSong(null)
  ElMessage.success('已移除衔接音乐')
}

// Remove song
const removeSong = (song: Song) => {
  ElMessageBox.confirm('确定要删除该歌曲吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    musicStore.removeSong(song.id)
    ElMessage.success('删除成功')
  }).catch(() => {
    // User canceled
  })
}

// Watch for current song changes
watch(currentSong, () => {
  if (audioRef.value && currentSong.value) {
    // Set the new source
    audioRef.value.src = currentSong.value.url
    
    // Play if isPlaying is true
    if (isPlaying.value) {
      audioRef.value.play().catch(error => {
        console.error('Error playing audio:', error)
        musicStore.pause()
      })
    }
  }
})

// Watch for isPlaying changes
watch(isPlaying, (newValue) => {
  if (audioRef.value) {
    if (newValue) {
      audioRef.value.play().catch(error => {
        console.error('Error playing audio:', error)
        musicStore.pause()
      })
    } else {
      audioRef.value.pause()
    }
  }
})

onMounted(() => {
  // Initialize audio elements
  if (audioRef.value) {
    audioRef.value.volume = volume.value / 100
  }
  
  if (transitionAudioRef.value) {
    transitionAudioRef.value.volume = volume.value / 100
  }
})

onUnmounted(() => {
  // Clean up
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
  
  if (transitionAudioRef.value) {
    transitionAudioRef.value.pause()
    transitionAudioRef.value.src = ''
  }
})
</script>

<template>
  <div class="music-container">
    <div class="page-header">
      <h2>音乐播放器</h2>
    </div>
    
    <div class="music-player-container">
      <div class="music-player">
        <div class="player-info">
          <div class="song-info">
            <h3>{{ currentSong?.name || '未选择歌曲' }}</h3>
          </div>
          
          <div class="player-controls">
            <div class="progress-container" @click="handleProgressClick">
              <div class="progress-bar">
                <div class="progress-current" :style="{ width: `${progress}%` }"></div>
              </div>
              <div class="time-info">
                <span>{{ currentTime }}</span>
                <span>{{ duration }}</span>
              </div>
            </div>
            
            <div class="control-buttons">
              <el-button
                :icon="shuffleMode ? 'Refresh' : 'Sort'"
                circle
                :type="shuffleMode ? 'primary' : 'info'"
                @click="toggleShuffle"
              />
              
              <el-button
                :icon="isPlaying ? 'VideoPause' : 'VideoPlay'"
                circle
                type="primary"
                @click="togglePlay"
              />
              
              <el-button
                icon="ArrowRight"
                circle
                @click="playNext"
              />
            </div>
            
            <div class="volume-control">
              <el-icon><Microphone /></el-icon>
              <el-slider
                v-model="volume"
                :min="0"
                :max="100"
                @change="handleVolumeChange"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div class="music-settings">
        <div class="upload-section">
          <h3>上传音乐</h3>
          <input
            ref="uploadRef"
            type="file"
            accept="audio/*"
            multiple
            style="display: none"
            @change="handleFileUpload"
          />
          <el-button type="primary" @click="uploadRef?.click()">
            <el-icon><Upload /></el-icon>
            选择音乐文件
          </el-button>
          <p class="upload-tip">支持MP3、WAV等音频格式</p>
        </div>
        
        <div class="transition-section">
          <h3>设置衔接音乐</h3>
          <p>在每首歌曲之间随机播放的衔接音乐</p>
          
          <div v-if="transitionSongName" class="transition-song">
            <span>当前衔接音乐: {{ transitionSongName }}</span>
            <el-button type="danger" size="small" @click="removeTransitionSong">
              移除
            </el-button>
          </div>
          
          <input
            type="file"
            accept="audio/*"
            style="display: none"
            ref="transitionUploadRef"
            @change="handleTransitionSongUpload"
          />
          <el-button @click="$refs.transitionUploadRef.click()">
            {{ transitionSongName ? '更换衔接音乐' : '设置衔接音乐' }}
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="song-list-container">
      <h3>播放列表 ({{ songs.length }}首)</h3>
      
      <el-table :data="songs" style="width: 100%">
        <el-table-column label="歌曲名" prop="name" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="removeSong(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="songs.length === 0" class="empty-list">
        <p>暂无歌曲，请上传音乐文件</p>
      </div>
    </div>
    
    <!-- Hidden audio elements -->
    <audio
      ref="audioRef"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    ></audio>
    
    <audio
      ref="transitionAudioRef"
    ></audio>
  </div>
</template>

<style scoped>
.music-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.music-player-container {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.music-player {
  flex: 2;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.music-settings {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.song-info h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-container {
  margin-bottom: 15px;
  cursor: pointer;
}

.progress-bar {
  height: 6px;
  background-color: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-current {
  height: 100%;
  background-color: #409eff;
  position: absolute;
  left: 0;
  top: 0;
}

.time-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-control .el-slider {
  margin-left: 10px;
  width: 100%;
}

.upload-section, .transition-section {
  margin-bottom: 20px;
}

.upload-section h3, .transition-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.upload-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.transition-song {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.transition-song span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
}

.song-list-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.song-list-container h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
}

.empty-list {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}

@media (max-width: 768px) {
  .music-player-container {
    flex-direction: column;
  }
}
</style>