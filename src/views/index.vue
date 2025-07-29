<template>
  <div class="app-container">
    <!-- 顶部操作栏 -->
    <div class="top-toolbar">
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="请输入设备名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select
            v-model="queryParams.deviceType"
            placeholder="请选择设备类型"
            clearable
            style="width: 150px"
          >
            <el-option label="水表" value="water_meter" />
            <el-option label="水压表" value="pressure_meter" />
          </el-select>
        </el-form-item>
        <el-form-item label="在线状态" prop="onlineStatus">
          <el-select
            v-model="queryParams.onlineStatus"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="primary" icon="Plus" @click="handleAdd">添加设备</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 设备卡片展示区域 -->
    <div class="device-cards">
      <el-row :gutter="20">
        <el-col
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="4"
          v-for="device in deviceList"
          :key="device.id"
          class="card-item"
        >
          <el-card class="device-card" shadow="hover" @click="handleDeviceClick(device)">
            <template #header>
              <div class="card-header">
                <span class="device-name">{{ device.deviceName }}</span>
                <el-tag
                  :type="device.onlineStatus === 'online' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ device.onlineStatus === 'online' ? '在线' : '离线' }}
                </el-tag>
              </div>
            </template>

            <div class="device-info">
              <!-- 设备图标 -->
              <div class="device-icon">
                <el-icon :size="40" :color="getDeviceIconColor(device.deviceType, device.onlineStatus)">
                  <component :is="getDeviceIcon(device.deviceType)" />
                </el-icon>
              </div>

              <!-- 设备信息 -->
              <div class="device-details">
                <div class="info-item">
                  <span class="label">设备类型:</span>
                  <span class="value">{{ getDeviceTypeName(device.deviceType) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">今日水量:</span>
                  <span class="value water-amount">{{ device.todayWaterAmount }} L</span>
                </div>
                <div class="info-item">
                  <span class="label">设备编号:</span>
                  <span class="value">{{ device.deviceCode }}</span>
                </div>
                <div class="info-item">
                  <span class="label">安装位置:</span>
                  <span class="value">{{ device.location }}</span>
                </div>
                <div class="info-item" v-if="device.deviceType === 'pressure_meter'">
                  <span class="label">当日平均压力:</span>
                  <span class="value pressure-value">{{ device.currentPressure }} MPa</span>
                </div>
                <div class="info-item">
                  <span class="label">最后更新:</span>
                  <span class="value">{{ formatTime(device.lastUpdateTime) }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <el-button type="primary" size="small" icon="View" @click.stop="handleView(device)">
                查看详情
              </el-button>
              <el-button type="warning" size="small" icon="Edit" @click.stop="handleEdit(device)">
                编辑
              </el-button>
              <el-button type="danger" size="small" icon="Delete" @click.stop="handleDelete(device)">
                删除
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="!deviceList.length" description="暂无设备数据" />
    </div>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 水表详情对话框 -->
    <el-dialog
      v-model="waterMeterDetailOpen"
      :title="waterMeterDetailForm.deviceName"
      width="1200px"
      append-to-body
      class="water-meter-dialog"
    >
      <!-- 顶部状态卡片 -->
      <el-row :gutter="20" class="status-cards">
        <el-col :span="8">
          <el-card class="status-card connection-status">
            <div class="status-content">
              <div class="status-icon">
                <el-icon :size="32" :color="waterMeterDetailForm.onlineStatus === 'online' ? '#67C23A' : '#F56C6C'">
                  <component :is="waterMeterDetailForm.onlineStatus === 'online' ? 'Connection' : 'Close'" />
                </el-icon>
              </div>
              <div class="status-info">
                <div class="status-title">连接状态</div>
                <div class="status-value" :class="waterMeterDetailForm.onlineStatus === 'online' ? 'online' : 'offline'">
                  {{ waterMeterDetailForm.onlineStatus === 'online' ? '在线' : '离线' }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="status-card today-usage">
            <div class="status-content">
              <div class="status-icon">
                <el-icon :size="32" color="#409EFF">
                  <Monitor />
                </el-icon>
              </div>
              <div class="status-info">
                <div class="status-title">今日用量</div>
                <div class="status-value">{{ waterMeterDetailForm.todayWaterAmount || 0 }} L</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="status-card monthly-usage">
            <div class="status-content">
              <div class="status-icon">
                <el-icon :size="32" color="#E6A23C">
                  <TrendCharts />
                </el-icon>
              </div>
              <div class="status-info">
                <div class="status-title">当月用水量</div>
                <div class="status-value">{{ waterMeterDetailForm.monthlyWaterAmount || 0 }} L</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 底部内容区域 -->
      <el-row :gutter="20" class="detail-content">
        <!-- 左侧：近七天用水量折线图 -->
        <el-col :span="16">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>近七天用水量趋势</span>
              </div>
            </template>
            <div ref="waterUsageChart" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 右侧：设备信息 -->
        <el-col :span="8">
          <el-card class="device-info-card">
            <template #header>
              <div class="card-header">
                <span>设备信息</span>
              </div>
            </template>
            <div class="device-info-content">
              <div class="info-group">
                <div class="info-item">
                  <span class="label">设备编号:</span>
                  <span class="value">{{ waterMeterDetailForm.deviceCode }}</span>
                </div>
                <div class="info-item">
                  <span class="label">设备类型:</span>
                  <span class="value">{{ getDeviceTypeName(waterMeterDetailForm.deviceType) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">安装位置:</span>
                  <span class="value">{{ waterMeterDetailForm.location }}</span>
                </div>
                <div class="info-item">
                  <span class="label">累计用水量:</span>
                  <span class="value">{{ waterMeterDetailForm.waterUsage || 0 }} L</span>
                </div>
              </div>

              <el-divider />

              <div class="info-group">
                <h4>通信参数</h4>
                <div class="info-item">
                  <span class="label">波特率:</span>
                  <span class="value">{{ waterMeterDetailForm.baudRate }}</span>
                </div>
                <div class="info-item">
                  <span class="label">数据位:</span>
                  <span class="value">{{ waterMeterDetailForm.dataBits }}</span>
                </div>
                <div class="info-item">
                  <span class="label">停止位:</span>
                  <span class="value">{{ waterMeterDetailForm.stopBits }}</span>
                </div>
                <div class="info-item">
                  <span class="label">校验位:</span>
                  <span class="value">{{ getParityName(waterMeterDetailForm.parity) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">协议类型:</span>
                  <span class="value">{{ getProtocolName(waterMeterDetailForm.protocolType) }}</span>
                </div>
              </div>

              <el-divider />

              <div class="info-group">
                <h4>时间信息</h4>
                <div class="info-item">
                  <span class="label">创建时间:</span>
                  <span class="value">{{ formatTime(waterMeterDetailForm.createTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">最后更新:</span>
                  <span class="value">{{ formatTime(waterMeterDetailForm.lastUpdateTime) }}</span>
                </div>
              </div>

              <el-divider />

              <div class="info-group">
                <div class="info-item">
                  <span class="label">设备描述:</span>
                  <span class="value">{{ waterMeterDetailForm.description || '暂无描述' }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="waterMeterDetailOpen = false">关 闭</el-button>
          <el-button type="primary" @click="handleEditFromWaterMeterDetail">编 辑</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看设备详情对话框 -->
    <el-dialog v-model="viewOpen" title="设备详情" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备编号">{{ viewForm.deviceCode }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ viewForm.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ getDeviceTypeName(viewForm.deviceType) }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">
          <el-tag :type="viewForm.onlineStatus === 'online' ? 'success' : 'danger'">
            {{ viewForm.onlineStatus === 'online' ? '在线' : '离线' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用水量">{{ viewForm.waterUsage || 0 }} L</el-descriptions-item>
        <el-descriptions-item label="波特率">{{ viewForm.baudRate }}</el-descriptions-item>
        <el-descriptions-item label="数据位">{{ viewForm.dataBits }}</el-descriptions-item>
        <el-descriptions-item label="停止位">{{ viewForm.stopBits }}</el-descriptions-item>
        <el-descriptions-item label="校验位">{{ viewForm.parity }}</el-descriptions-item>
        <el-descriptions-item label="协议类型">{{ viewForm.protocolType }}</el-descriptions-item>
        <el-descriptions-item label="安装位置" :span="2">{{ viewForm.location }}</el-descriptions-item>
        <el-descriptions-item label="设备描述" :span="2">{{ viewForm.description || '暂无描述' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatTime(viewForm.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新" :span="2">{{ formatTime(viewForm.lastUpdateTime) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewOpen = false">关 闭</el-button>
          <el-button type="primary" @click="handleEditFromView">编 辑</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑设备对话框 -->
    <el-dialog v-model="editOpen" :title="title" width="800px" append-to-body>
      <el-form ref="deviceRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编号" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="请输入设备编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="deviceType">
              <el-select v-model="form.deviceType" placeholder="请选择设备类型" style="width: 100%">
                <el-option label="水表" value="water_meter" />
                <el-option label="水压表" value="pressure_meter" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="在线状态" prop="onlineStatus">
              <el-select v-model="form.onlineStatus" placeholder="请选择状态" style="width: 100%">
                <el-option label="在线" value="online" />
                <el-option label="离线" value="offline" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用水量" prop="waterUsage">
              <el-input-number
                v-model="form.waterUsage"
                :min="0"
                :precision="2"
                placeholder="请输入用水量"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="波特率" prop="baudRate">
              <el-select v-model="form.baudRate" placeholder="请选择波特率" style="width: 100%">
                <el-option label="9600" value="9600" />
                <el-option label="19200" value="19200" />
                <el-option label="38400" value="38400" />
                <el-option label="57600" value="57600" />
                <el-option label="115200" value="115200" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据位" prop="dataBits">
              <el-select v-model="form.dataBits" placeholder="请选择数据位" style="width: 100%">
                <el-option label="7" value="7" />
                <el-option label="8" value="8" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="停止位" prop="stopBits">
              <el-select v-model="form.stopBits" placeholder="请选择停止位" style="width: 100%">
                <el-option label="1" value="1" />
                <el-option label="1.5" value="1.5" />
                <el-option label="2" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="校验位" prop="parity">
              <el-select v-model="form.parity" placeholder="请选择校验位" style="width: 100%">
                <el-option label="无校验" value="none" />
                <el-option label="奇校验" value="odd" />
                <el-option label="偶校验" value="even" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议类型" prop="protocolType">
              <el-select v-model="form.protocolType" placeholder="请选择协议类型" style="width: 100%">
                <el-option label="Modbus RTU" value="modbus_rtu" />
                <el-option label="Modbus TCP" value="modbus_tcp" />
                <el-option label="DL/T 645" value="dlt645" />
                <el-option label="自定义协议" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="安装位置" prop="location">
              <el-input v-model="form.location" placeholder="请输入安装位置" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                placeholder="请输入设备描述"
                :rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Index">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor,
  OfficeBuilding,
  Search,
  Refresh,
  Plus,
  View,
  Edit,
  Delete,
  Connection,
  Close,
  TrendCharts
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const deviceList = ref([])
const editOpen = ref(false)
const viewOpen = ref(false)
const waterMeterDetailOpen = ref(false)
const loading = ref(true)
const title = ref('')
const total = ref(0)
const waterUsageChart = ref(null)
let chartInstance = null

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 12,
  deviceName: '',
  deviceType: '',
  onlineStatus: ''
})

// 表单数据
const form = reactive({
  id: null,
  deviceName: '',
  deviceType: '',
  deviceCode: '',
  location: '',
  description: '',
  onlineStatus: 'offline',
  waterUsage: 0,
  baudRate: '9600',
  dataBits: '8',
  stopBits: '1',
  parity: 'none',
  protocolType: 'modbus_rtu'
})

// 查看详情数据
const viewForm = reactive({
  id: null,
  deviceName: '',
  deviceType: '',
  deviceCode: '',
  location: '',
  description: '',
  onlineStatus: 'offline',
  waterUsage: 0,
  baudRate: '9600',
  dataBits: '8',
  stopBits: '1',
  parity: 'none',
  protocolType: 'modbus_rtu',
  createTime: null,
  lastUpdateTime: null
})

// 水表详情数据
const waterMeterDetailForm = reactive({
  id: null,
  deviceName: '',
  deviceType: '',
  deviceCode: '',
  location: '',
  description: '',
  onlineStatus: 'offline',
  waterUsage: 0,
  todayWaterAmount: 0,
  monthlyWaterAmount: 0,
  baudRate: '9600',
  dataBits: '8',
  stopBits: '1',
  parity: 'none',
  protocolType: 'modbus_rtu',
  createTime: null,
  lastUpdateTime: null
})

// 表单验证规则
const rules = reactive({
  deviceName: [
    { required: true, message: '设备名称不能为空', trigger: 'blur' }
  ],
  deviceType: [
    { required: true, message: '设备类型不能为空', trigger: 'change' }
  ],
  deviceCode: [
    { required: true, message: '设备编号不能为空', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '安装位置不能为空', trigger: 'blur' }
  ],
  onlineStatus: [
    { required: true, message: '在线状态不能为空', trigger: 'change' }
  ],
  baudRate: [
    { required: true, message: '波特率不能为空', trigger: 'change' }
  ],
  dataBits: [
    { required: true, message: '数据位不能为空', trigger: 'change' }
  ],
  stopBits: [
    { required: true, message: '停止位不能为空', trigger: 'change' }
  ],
  parity: [
    { required: true, message: '校验位不能为空', trigger: 'change' }
  ],
  protocolType: [
    { required: true, message: '协议类型不能为空', trigger: 'change' }
  ]
})

// 模拟数据
const mockDeviceData = [
  {
    id: 1,
    deviceName: '1号楼水表',
    deviceType: 'water_meter',
    deviceCode: 'WM001',
    location: '1号楼地下室',
    todayWaterAmount: 1250.5,
    monthlyWaterAmount: 35680.2,
    currentPressure: null,
    onlineStatus: 'online',
    lastUpdateTime: new Date(),
    description: '1号楼主水表',
    waterUsage: 1250.5,
    baudRate: '9600',
    dataBits: '8',
    stopBits: '1',
    parity: 'none',
    protocolType: 'modbus_rtu',
    createTime: new Date(Date.now() - 86400000 * 30)
  },
  {
    id: 2,
    deviceName: '2号楼水压表',
    deviceType: 'pressure_meter',
    deviceCode: 'PM001',
    location: '2号楼顶层',
    todayWaterAmount: 0,
    monthlyWaterAmount: 0,
    currentPressure: 0.45,
    onlineStatus: 'online',
    lastUpdateTime: new Date(Date.now() - 300000),
    description: '2号楼水压监测',
    waterUsage: 0,
    baudRate: '19200',
    dataBits: '8',
    stopBits: '1',
    parity: 'even',
    protocolType: 'modbus_tcp',
    createTime: new Date(Date.now() - 86400000 * 25)
  },
  {
    id: 3,
    deviceName: '3号楼水表',
    deviceType: 'water_meter',
    deviceCode: 'WM002',
    location: '3号楼地下室',
    todayWaterAmount: 890.2,
    monthlyWaterAmount: 28450.8,
    currentPressure: null,
    onlineStatus: 'offline',
    lastUpdateTime: new Date(Date.now() - 3600000),
    description: '3号楼主水表',
    waterUsage: 890.2,
    baudRate: '9600',
    dataBits: '8',
    stopBits: '1',
    parity: 'none',
    protocolType: 'dlt645',
    createTime: new Date(Date.now() - 86400000 * 20)
  },
  {
    id: 4,
    deviceName: '4号楼水压表',
    deviceType: 'pressure_meter',
    deviceCode: 'PM002',
    location: '4号楼中层',
    todayWaterAmount: 0,
    monthlyWaterAmount: 0,
    currentPressure: 0.38,
    onlineStatus: 'online',
    lastUpdateTime: new Date(Date.now() - 120000),
    description: '4号楼水压监测',
    waterUsage: 0,
    baudRate: '38400',
    dataBits: '8',
    stopBits: '1',
    parity: 'odd',
    protocolType: 'modbus_rtu',
    createTime: new Date(Date.now() - 86400000 * 15)
  },
  {
    id: 5,
    deviceName: '5号楼水表',
    deviceType: 'water_meter',
    deviceCode: 'WM003',
    location: '5号楼地下室',
    todayWaterAmount: 2100.8,
    monthlyWaterAmount: 52340.5,
    currentPressure: null,
    onlineStatus: 'online',
    lastUpdateTime: new Date(Date.now() - 60000),
    description: '5号楼主水表',
    waterUsage: 2100.8,
    baudRate: '115200',
    dataBits: '8',
    stopBits: '1',
    parity: 'none',
    protocolType: 'custom',
    createTime: new Date(Date.now() - 86400000 * 10)
  },
  {
    id: 6,
    deviceName: '6号楼水表',
    deviceType: 'water_meter',
    deviceCode: 'WM004',
    location: '6号楼地下室',
    todayWaterAmount: 1567.3,
    monthlyWaterAmount: 41230.7,
    currentPressure: null,
    onlineStatus: 'offline',
    lastUpdateTime: new Date(Date.now() - 7200000),
    description: '6号楼主水表',
    waterUsage: 1567.3,
    baudRate: '57600',
    dataBits: '7',
    stopBits: '2',
    parity: 'even',
    protocolType: 'modbus_rtu',
    createTime: new Date(Date.now() - 86400000 * 5)
  }
]

// 获取设备列表
const getList = () => {
  loading.value = true

  // 模拟API调用
  setTimeout(() => {
    let filteredData = [...mockDeviceData]

    // 应用筛选条件
    if (queryParams.deviceName) {
      filteredData = filteredData.filter(item =>
        item.deviceName.includes(queryParams.deviceName)
      )
    }
    if (queryParams.deviceType) {
      filteredData = filteredData.filter(item =>
        item.deviceType === queryParams.deviceType
      )
    }
    if (queryParams.onlineStatus) {
      filteredData = filteredData.filter(item =>
        item.onlineStatus === queryParams.onlineStatus
      )
    }

    // 分页处理
    const start = (queryParams.pageNum - 1) * queryParams.pageSize
    const end = start + queryParams.pageSize

    deviceList.value = filteredData.slice(start, end)
    total.value = filteredData.length
    loading.value = false
  }, 500)
}

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置搜索
const resetQuery = () => {
  queryParams.deviceName = ''
  queryParams.deviceType = ''
  queryParams.onlineStatus = ''
  queryParams.pageNum = 1
  getList()
}

// 添加设备
const handleAdd = () => {
  reset()
  editOpen.value = true
  title.value = '添加设备'
}

// 编辑设备
const handleEdit = (row) => {
  reset()
  const deviceId = row.id
  // 模拟获取设备详情
  const device = mockDeviceData.find(item => item.id === deviceId)
  if (device) {
    Object.assign(form, device)
  }
  editOpen.value = true
  title.value = '修改设备'
}

// 查看设备详情
const handleView = (row) => {
  const deviceId = row.id
  // 模拟获取设备详情
  const device = mockDeviceData.find(item => item.id === deviceId)
  if (device) {
    Object.assign(viewForm, device)
  }
  viewOpen.value = true
}

// 从查看详情跳转到编辑
const handleEditFromView = () => {
  Object.assign(form, viewForm)
  viewOpen.value = false
  editOpen.value = true
  title.value = '修改设备'
}

// 从水表详情跳转到编辑
const handleEditFromWaterMeterDetail = () => {
  Object.assign(form, waterMeterDetailForm)
  waterMeterDetailOpen.value = false
  editOpen.value = true
  title.value = '修改设备'
}

// 删除设备
const handleDelete = (row) => {
  ElMessageBox.confirm(`是否确认删除设备"${row.deviceName}"?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    const index = mockDeviceData.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockDeviceData.splice(index, 1)
      getList()
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 设备卡片点击
const handleDeviceClick = (device) => {
  if (device.deviceType === 'water_meter') {
    // 水表点击打开专门的水表详情对话框
    const deviceData = mockDeviceData.find(item => item.id === device.id)
    if (deviceData) {
      Object.assign(waterMeterDetailForm, deviceData)
      waterMeterDetailOpen.value = true
      // 等待对话框打开后初始化图表
      nextTick(() => {
        initWaterUsageChart()
      })
    }
  } else {
    // 其他设备类型打开通用详情对话框
    const deviceData = mockDeviceData.find(item => item.id === device.id)
    if (deviceData) {
      Object.assign(viewForm, deviceData)
      viewOpen.value = true
    }
  }
}



// 重置表单
const reset = () => {
  form.id = null
  form.deviceName = ''
  form.deviceType = ''
  form.deviceCode = ''
  form.location = ''
  form.description = ''
  form.onlineStatus = 'offline'
  form.waterUsage = 0
  form.baudRate = '9600'
  form.dataBits = '8'
  form.stopBits = '1'
  form.parity = 'none'
  form.protocolType = 'modbus_rtu'
}

// 取消
const cancel = () => {
  editOpen.value = false
  reset()
}

// 提交表单
const submitForm = () => {
  // 这里应该调用API保存数据
  if (form.id) {
    // 编辑
    const index = mockDeviceData.findIndex(item => item.id === form.id)
    if (index > -1) {
      Object.assign(mockDeviceData[index], {
        ...form,
        lastUpdateTime: new Date()
      })
      ElMessage.success('修改成功')
    }
  } else {
    // 新增
    const newDevice = {
      ...form,
      id: Date.now(),
      todayWaterAmount: form.waterUsage || 0,
      currentPressure: form.deviceType === 'pressure_meter' ? 0 : null,
      lastUpdateTime: new Date(),
      createTime: new Date()
    }
    mockDeviceData.push(newDevice)
    ElMessage.success('新增成功')
  }

  editOpen.value = false
  getList()
  reset()
}

// 获取设备类型名称
const getDeviceTypeName = (type) => {
  const typeMap = {
    'water_meter': '水表',
    'pressure_meter': '水压表'
  }
  return typeMap[type] || '未知'
}

// 获取设备图标
const getDeviceIcon = (type) => {
  const iconMap = {
    'water_meter': Monitor,
    'pressure_meter': OfficeBuilding
  }
  return iconMap[type] || Monitor
}

// 获取设备图标颜色
const getDeviceIconColor = (type, status) => {
  if (status === 'offline') return '#909399'

  const colorMap = {
    'water_meter': '#409EFF',
    'pressure_meter': '#67C23A'
  }
  return colorMap[type] || '#409EFF'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`

  return date.toLocaleString()
}

// 获取校验位名称
const getParityName = (parity) => {
  const parityMap = {
    'none': '无校验',
    'odd': '奇校验',
    'even': '偶校验'
  }
  return parityMap[parity] || '未知'
}

// 获取协议类型名称
const getProtocolName = (protocol) => {
  const protocolMap = {
    'modbus_rtu': 'Modbus RTU',
    'modbus_tcp': 'Modbus TCP',
    'dlt645': 'DL/T 645',
    'custom': '自定义协议'
  }
  return protocolMap[protocol] || '未知'
}

// 初始化水表用量图表
const initWaterUsageChart = () => {
  if (!waterUsageChart.value) return

  // 销毁之前的图表实例
  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(waterUsageChart.value)

  // 生成近七天的模拟数据
  const dates = []
  const waterUsageData = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))

    // 生成模拟用水量数据（基于设备当前用水量的变化）
    const baseUsage = waterMeterDetailForm.todayWaterAmount || 1000
    const randomVariation = (Math.random() - 0.5) * 500
    waterUsageData.push(Math.max(0, baseUsage + randomVariation))
  }

  const option = {
    title: {
      text: '近七天用水量趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}<br/>用水量: ${params[0].value.toFixed(2)} L`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '用水量 (L)',
      axisLabel: {
        fontSize: 12,
        formatter: '{value} L'
      }
    },
    series: [
      {
        name: '用水量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#409EFF',
          width: 3
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(64, 158, 255, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(64, 158, 255, 0.1)'
              }
            ]
          }
        },
        data: waterUsageData
      }
    ]
  }

  chartInstance.setOption(option)

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

// 组件挂载时获取数据
onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.top-toolbar {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.device-cards {
  margin-bottom: 20px;
}

.card-item {
  margin-bottom: 20px;
}

.device-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .device-name {
    font-weight: 600;
    font-size: 16px;
    color: #303133;
  }
}

.device-info {
  margin-bottom: 16px;
}

.device-icon {
  text-align: center;
  margin-bottom: 16px;
}

.device-details {
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;

    .label {
      color: #909399;
      font-weight: 500;
    }

    .value {
      color: #303133;
      font-weight: 600;

      &.water-amount {
        color: #409EFF;
        font-size: 16px;
      }

      &.pressure-value {
        color: #67C23A;
        font-size: 16px;
      }
    }
  }
}

.card-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;

  .el-button {
    flex: 1;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .top-toolbar {
    .el-form {
      .el-form-item {
        margin-bottom: 15px;

        .el-input,
        .el-select {
          width: 160px !important;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .top-toolbar {
    padding: 15px;

    .el-form {
      .el-form-item {
        margin-bottom: 15px;

        .el-input,
        .el-select {
          width: 140px !important;
        }
      }
    }
  }

  .device-card {
    .card-actions {
      flex-direction: column;
      gap: 8px;

      .el-button {
        width: 100%;
      }
    }
  }
}

@media (max-width: 576px) {
  .app-container {
    padding: 10px;
  }

  .top-toolbar {
    padding: 10px;

    .el-col:last-child {
      text-align: left;
      margin-top: 15px;
    }
  }

  .device-details {
    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;

      .value {
        align-self: flex-end;
      }
    }
  }
}

// 水表详情对话框样式
.water-meter-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.status-cards {
  margin-bottom: 20px;
}

.status-card {
  height: 120px;

  :deep(.el-card__body) {
    padding: 20px;
    height: 100%;
    display: flex;
    align-items: center;
  }

  &.connection-status {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  }

  &.today-usage {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  &.monthly-usage {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }
}

.status-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.status-icon {
  margin-right: 16px;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.status-value {
  font-size: 24px;
  font-weight: bold;

  &.online {
    color: #67C23A;
  }

  &.offline {
    color: #F56C6C;
  }
}

.detail-content {
  margin-top: 20px;
}

.chart-card {
  height: 400px;

  :deep(.el-card__body) {
    padding: 20px;
    height: calc(100% - 60px);
  }
}

.chart-container {
  width: 100%;
  height: 100%;
}

.device-info-card {
  height: 400px;

  :deep(.el-card__body) {
    padding: 20px;
    height: calc(100% - 60px);
    overflow-y: auto;
  }
}

.device-info-content {
  .info-group {
    margin-bottom: 16px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #303133;
      font-weight: 600;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;

      .label {
        color: #909399;
        font-weight: 500;
        min-width: 80px;
      }

      .value {
        color: #303133;
        font-weight: 600;
        text-align: right;
        flex: 1;
        margin-left: 12px;
      }
    }
  }

  :deep(.el-divider) {
    margin: 16px 0;
  }
}

// 暗色主题适配
html.dark {
  .top-toolbar {
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color);
  }

  .device-card {
    :deep(.el-card) {
      background: var(--el-bg-color-overlay);
      border: 1px solid var(--el-border-color);
    }

    &:hover {
      box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
    }
  }

  .card-header {
    .device-name {
      color: var(--el-text-color-primary);
    }
  }

  .device-details {
    .info-item {
      .label {
        color: var(--el-text-color-regular);
      }

      .value {
        color: var(--el-text-color-primary);
      }
    }
  }

  .status-card {
    &.connection-status {
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    }

    &.today-usage {
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    }

    &.monthly-usage {
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    }
  }

  .status-title {
    color: var(--el-text-color-regular);
  }

  .device-info-content {
    .info-group {
      h4 {
        color: var(--el-text-color-primary);
      }

      .info-item {
        .label {
          color: var(--el-text-color-regular);
        }

        .value {
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}
</style>
