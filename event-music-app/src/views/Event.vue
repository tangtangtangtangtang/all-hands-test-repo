<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEventStore, Event } from '../store/event'
import type { FormInstance, FormRules } from 'element-plus'

const eventStore = useEventStore()
const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const mapDialogVisible = ref(false)
const loading = ref(false)
const posterPreview = ref('')

// Form data
const form = ref({
  organizer: '',
  location: {
    name: '',
    lat: 0,
    lng: 0
  },
  date: '',
  time: '',
  content: '',
  poster: ''
})

// Form validation rules
const rules = ref<FormRules>({
  organizer: [
    { required: true, message: '请输入主办单位', trigger: 'blur' }
  ],
  'location.name': [
    { required: true, message: '请选择活动地点', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择活动日期', trigger: 'blur' }
  ],
  time: [
    { required: true, message: '请选择活动时间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入活动内容', trigger: 'blur' }
  ]
})

// Table data
const tableData = ref<Event[]>([])

onMounted(() => {
  // Load events from store
  eventStore.loadEvents()
  tableData.value = eventStore.events
})

// Handle map selection
const handleMapSelect = () => {
  mapDialogVisible.value = true
  
  // In a real app, we would initialize the Tencent Map here
  // For this demo, we'll simulate selecting a location
  setTimeout(() => {
    // Simulate user selecting a location
    form.value.location = {
      name: '示例地点',
      lat: 39.9042,
      lng: 116.4074
    }
    mapDialogVisible.value = false
    ElMessage.success('已选择地点')
  }, 1000)
}

// Handle poster upload
const handlePosterUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    const reader = new FileReader()
    
    reader.onload = (e) => {
      if (e.target) {
        form.value.poster = e.target.result as string
        posterPreview.value = e.target.result as string
      }
    }
    
    reader.readAsDataURL(file)
  }
}

// Submit form
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      try {
        // Add event to store
        const newEvent = eventStore.addEvent({
          organizer: form.value.organizer,
          location: form.value.location,
          date: form.value.date,
          time: form.value.time,
          content: form.value.content,
          poster: form.value.poster
        })
        
        // Update table data
        tableData.value = [...eventStore.events]
        
        // Reset form
        resetForm()
        
        // Close dialog
        dialogVisible.value = false
        
        ElMessage.success('活动发布成功')
      } catch (error) {
        console.error('Error adding event:', error)
        ElMessage.error('活动发布失败，请重试')
      } finally {
        loading.value = false
      }
    } else {
      ElMessage.error('请完善表单信息')
      return false
    }
  })
}

// Reset form
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  form.value = {
    organizer: '',
    location: {
      name: '',
      lat: 0,
      lng: 0
    },
    date: '',
    time: '',
    content: '',
    poster: ''
  }
  
  posterPreview.value = ''
}

// Delete event
const handleDelete = (row: Event) => {
  ElMessageBox.confirm('确定要删除该活动吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    eventStore.deleteEvent(row.id)
    tableData.value = [...eventStore.events]
    ElMessage.success('删除成功')
  }).catch(() => {
    // User canceled
  })
}

// Format date for display
const formatDate = (date: string, time: string) => {
  return `${date} ${time}`
}
</script>

<template>
  <div class="event-container">
    <div class="page-header">
      <h2>活动发布管理</h2>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon><Plus /></el-icon>
        发布新活动
      </el-button>
    </div>
    
    <div class="event-list">
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column prop="organizer" label="主办单位" width="180" />
        <el-table-column prop="location.name" label="活动地点" width="180" />
        <el-table-column label="活动时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.date, scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="content" label="活动内容" />
        <el-table-column label="活动海报" width="120">
          <template #default="scope">
            <el-image
              v-if="scope.row.poster"
              :src="scope.row.poster"
              style="width: 80px; height: 80px"
              fit="cover"
              :preview-src-list="[scope.row.poster]"
            />
            <span v-else>无海报</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- Event Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      title="发布活动"
      width="50%"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="主办单位" prop="organizer">
          <el-input v-model="form.organizer" placeholder="请输入主办单位" />
        </el-form-item>
        
        <el-form-item label="活动地点" prop="location.name">
          <div class="location-input">
            <el-input
              v-model="form.location.name"
              placeholder="请选择活动地点"
              readonly
            />
            <el-button type="primary" @click="handleMapSelect">
              选择地点
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="活动日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="活动时间" prop="time">
          <el-time-picker
            v-model="form.time"
            placeholder="选择时间"
            style="width: 100%"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="活动内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入活动内容"
          />
        </el-form-item>
        
        <el-form-item label="活动海报">
          <input
            type="file"
            accept="image/*"
            @change="handlePosterUpload"
            style="display: none"
            ref="posterInput"
          />
          <el-button @click="$refs.posterInput.click()">
            上传海报
          </el-button>
          <div v-if="posterPreview" class="poster-preview">
            <el-image
              :src="posterPreview"
              style="width: 100px; height: 100px"
              fit="cover"
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="loading" @click="submitForm">
            发布
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Map Dialog (Simulated) -->
    <el-dialog
      v-model="mapDialogVisible"
      title="选择地点"
      width="70%"
    >
      <div class="map-container">
        <div class="map-placeholder">
          <p>这里是腾讯地图选择界面（模拟）</p>
          <p>在实际应用中，这里会集成腾讯地图SDK</p>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mapDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="mapDialogVisible = false">
            确认选择
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.event-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.event-list {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.location-input {
  display: flex;
  gap: 10px;
}

.poster-preview {
  margin-top: 10px;
}

.map-container {
  height: 400px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.map-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 16px;
}
</style>