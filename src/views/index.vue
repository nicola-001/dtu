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
        <el-form-item label="设备类型" prop="type">
          <el-select
              v-model="queryParams.type"
              placeholder="请选择设备类型"
              clearable
              style="width: 150px"
          >
            <el-option label="水表" value="WATER"/>
            <el-option label="水压表" value="PRESSURE"/>
          </el-select>
        </el-form-item>
        <el-form-item label="在线状态" prop="status">
          <el-select
              v-model="queryParams.status"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
          >
            <el-option label="在线" value="ONLINE"/>
            <el-option label="离线" value="OFFLINE"/>
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
                    :type="device.status === 'ONLINE' ? 'success' : 'danger'"
                    size="small"
                >
                  {{ device.status === 'ONLINE' ? '在线' : '离线' }}
                </el-tag>
              </div>
            </template>

            <div class="device-info">
              <!-- 设备图标 -->
              <div class="device-icon">
                <el-icon :size="40" :color="getDeviceIconColor(device.deviceType, device.status)">
                  <component :is="getDeviceIcon(device.deviceType)"/>
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
                  <span class="value">{{ device.installationLocation }}</span>
                </div>
                <div class="info-item" v-if="device.deviceType === 'PRESSURE'">
                  <span class="label">当前压力:</span>
                  <span class="value pressure-value">{{ device.currentPressure }} MPa</span>
                </div>
                <div class="info-item">
                  <span class="label">最后更新:</span>
                  <span class="value">{{ device.updateTime }}</span>
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
      <el-empty v-if="!deviceList.length" description="暂无设备数据"/>
    </div>

    <!-- 分页 -->
    <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.current"
        v-model:limit="queryParams.size"
        :page-sizes="[4, 8, 12, 16]"
        @pagination="getAllDeviceList"
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
                <el-icon :size="32" :color="waterMeterDetailForm.status === 'ONLINE' ? '#67C23A' : '#F56C6C'">
                  <component :is="waterMeterDetailForm.status === 'ONLINE' ? 'Connection' : 'Close'"/>
                </el-icon>
              </div>
              <div class="status-info">
                <div class="status-title">连接状态</div>
                <div class="status-value"
                     :class="waterMeterDetailForm.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'">
                  {{ waterMeterDetailForm.status === 'ONLINE' ? '在线' : '离线' }}
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
                  <Monitor/>
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
                  <TrendCharts/>
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
                  <span class="value">{{ waterMeterDetailForm.installationLocation }}</span>
                </div>
                <div class="info-item">
                  <span class="label">累计用水量:</span>
                  <span class="value">{{ waterMeterDetailForm.cumulativeUsage || 0 }} L</span>
                </div>
              </div>

              <el-divider/>

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
                  <span class="value">{{ waterMeterDetailForm.protocolType }}</span>
                </div>
              </div>

              <el-divider/>

              <div class="info-group">
                <h4>时间信息</h4>
                <div class="info-item">
                  <span class="label">创建时间:</span>
                  <span class="value">{{ formatTime(waterMeterDetailForm.createTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">最后更新:</span>
                  <span class="value">{{ formatTime(waterMeterDetailForm.updateTime) }}</span>
                </div>
              </div>

              <el-divider/>

              <div class="info-group">
                <div class="info-item">
                  <span class="label">设备描述:</span>
                  <span class="value">{{ waterMeterDetailForm.deviceDescription || '暂无描述' }}</span>
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
          <el-tag :type="viewForm.status === 'ONLINE' ? 'success' : 'danger'">
            {{ viewForm.status === 'ONLINE' ? '在线' : '离线' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用水量">{{ viewForm.cumulativeUsage || 0 }} L</el-descriptions-item>
        <el-descriptions-item label="波特率">{{ viewForm.baudRate }}</el-descriptions-item>
        <el-descriptions-item label="数据位">{{ viewForm.dataBits }}</el-descriptions-item>
        <el-descriptions-item label="停止位">{{ viewForm.stopBits }}</el-descriptions-item>
        <el-descriptions-item label="校验位">{{ viewForm.parity }}</el-descriptions-item>
        <el-descriptions-item label="协议类型">{{ viewForm.protocolType }}</el-descriptions-item>
        <el-descriptions-item label="ip地址">{{ viewForm.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="端口号">{{ viewForm.port }}</el-descriptions-item>
        <el-descriptions-item label="SIM卡">{{ viewForm.simCardNumber }}</el-descriptions-item>
        <el-descriptions-item label="安装位置" :span="2">{{ viewForm.installationLocation }}</el-descriptions-item>
        <el-descriptions-item label="设备描述" :span="2">{{
            viewForm.deviceDescription || '暂无描述'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ viewForm.createTime }}</el-descriptions-item>
        <el-descriptions-item label="最后更新" :span="2">{{
            viewForm.updateTime
          }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewOpen = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑设备对话框 -->
    <el-dialog v-model="editOpen" :title="title" width="800px" append-to-body>
      <el-form ref="deviceRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编号" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="请输入设备编号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="请输入设备名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="deviceType">
              <el-select v-model="form.deviceType" placeholder="请选择设备类型" style="width: 100%">
                <el-option label="水表" value="WATER"/>
                <el-option label="水压表" value="PRESSURE"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="在线状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="在线" value="ONLINE"/>
                <el-option label="离线" value="OFFLINE"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用水量" prop="cumulativeUsage">
              <el-input-number
                  v-model="form.cumulativeUsage"
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
                <el-option label="9600" value="9600"/>
                <el-option label="19200" value="19200"/>
                <el-option label="38400" value="38400"/>
                <el-option label="57600" value="57600"/>
                <el-option label="115200" value="115200"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据位" prop="dataBits">
              <el-select v-model="form.dataBits" placeholder="请选择数据位" style="width: 100%">
                <el-option label="7" value="7"/>
                <el-option label="8" value="8"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="停止位" prop="stopBits">
              <el-select v-model="form.stopBits" placeholder="请选择停止位" style="width: 100%">
                <el-option label="1" value="1"/>
                <el-option label="2" value="2"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="校验位" prop="parity">
              <el-select v-model="form.parity" placeholder="请选择校验位" style="width: 100%">
                <el-option label="奇校验" value="O"/>
                <el-option label="偶校验" value="E"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议类型" prop="protocolType">
              <el-select v-model="form.protocolType" placeholder="请选择协议类型" style="width: 100%">
                <el-option label="Modbus RTU" value="modbus_rtu"/>
                <el-option label="Modbus TCP" value="modbus_tcp"/>
                <el-option label="DL/T 645" value="dlt645"/>
                <el-option label="自定义协议" value="custom"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ip地址" prop="ipAddress">
              <el-input v-model="form.ipAddress" placeholder="请输入ip地址"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="port" prop="port">
              <el-input v-model="form.port" placeholder="请输入端口号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SIM" prop="simCardNumber">
              <el-input v-model="form.simCardNumber" placeholder="请输入SIM卡号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安装位置" prop="installationLocation">
              <el-input v-model="form.installationLocation" placeholder="请输入安装位置"/>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备描述" prop="deviceDescription">
              <el-input
                  v-model="form.deviceDescription"
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
import {ref, reactive, onMounted, nextTick} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  Monitor,
  OfficeBuilding,
  TrendCharts
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {addDevice, deleteDevice, getDeviceList, updateDevice} from "@/api/device/device.js";

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
  current: 1,
  size: 4,
  deviceName: '',
  type: '',
  status: ''
})

// 表单数据
let form = reactive({
  id: null,
  deviceCode: '',
  deviceName: '',
  status: '',
  installationLocation: '',
  protocolType: '',
  deviceDescription: '',
  baudRate: '',
  dataBits: '',
  stopBits: '',
  parity: '',
  deviceType: '',
  cumulativeUsage: 0,
  ipAddress: '',
  port: '',
  simCardNumber: ''
})

// 查看详情数据
const viewForm = reactive({
  id: null,
  deviceName: '',
  deviceType: '',
  deviceCode: '',
  installationLocation: '',
  deviceDescription: '',
  status: '',
  cumulativeUsage: 0,
  baudRate: '',
  dataBits: '',
  stopBits: '',
  parity: '',
  ipAddress: '',
  port: '',
  simCardNumber: '',
  protocolType: '',
  createTime: null,
  updateTime: null
})

// 水表详情数据
const waterMeterDetailForm = reactive({
  id: null,
  deviceName: '',
  deviceType: '',
  deviceCode: '',
  installationLocation: '',
  deviceDescription: '',
  status: 'OFFLINE',
  cumulativeUsage: 0,
  todayWaterAmount: 0,
  monthlyWaterAmount: 0,
  baudRate: '9600',
  dataBits: '8',
  stopBits: '1',
  parity: '',
  protocolType: 'modbus_rtu',
  ipAddress: '',
  port: '8888',
  simCardNumber: '111-111',
  createTime: null,
  updateTime: null
})

// 表单验证规则
const rules = reactive({
  deviceName: [
    {required: true, message: '设备名称不能为空', trigger: 'blur'}
  ],
  deviceType: [
    {required: true, message: '设备类型不能为空', trigger: 'change'}
  ],
  deviceCode: [
    {required: true, message: '设备编号不能为空', trigger: 'blur'}
  ],
  installationLocation: [
    {required: true, message: '安装位置不能为空', trigger: 'blur'}
  ],
  status: [
    {required: true, message: '在线状态不能为空', trigger: 'change'}
  ],
  baudRate: [
    {required: true, message: '波特率不能为空', trigger: 'change'}
  ],
  dataBits: [
    {required: true, message: '数据位不能为空', trigger: 'change'}
  ],
  stopBits: [
    {required: true, message: '停止位不能为空', trigger: 'change'}
  ],
  parity: [
    {required: true, message: '校验位不能为空', trigger: 'change'}
  ],
  deviceDescription: [
    {required: true, message: '设备描述不能为空', trigger: 'blur'}
  ],
  protocolType: [
    {required: true, message: '协议类型不能为空', trigger: 'change'}
  ]
})


//获取表单数据

const getAllDeviceList = async () => {
  loading.value = true

  try {
    // 调用后端API获取数据
    const res = await getDeviceList(queryParams)
    let filteredData = res.data.records || []
    total.value = res.data.total
    // 数据预处理 - 添加前端需要的字段
    filteredData = filteredData.map(item => ({
      ...item,
      // 为水表添加今日用水量和月用水量（如果后端没有提供）
      todayWaterAmount: item.deviceType === 'WATER' ? parseFloat(item.cumulativeUsage || 0) * 0.1 : 0,
      monthlyWaterAmount: item.deviceType === 'WATER' ? parseFloat(item.cumulativeUsage || 0) : 0,
      // 为水压表添加当前压力值（如果后端没有提供）
      currentPressure: item.deviceType === 'PRESSURE' ? (Math.random() * 0.5 + 0.2).toFixed(2) : null,
    }))
    // 应用筛选条件--模糊搜索
    if (queryParams.deviceName) {
      filteredData = filteredData.filter(item =>
          item.deviceName.includes(queryParams.deviceName)
      )
    }

    // 分页处理
    // const start = (queryParams.pageNum - 1) * queryParams.size
    // const end = start + queryParams.size
    //
    // deviceList.value = filteredData.slice(start, end)

    // 直接将数据赋给deviceList
    deviceList.value = filteredData;

  } finally {
    loading.value = false
  }
}
// 组件挂载时获取数据
onMounted(() => {
  // getList()
  getAllDeviceList();
})


// 模拟数据（基于后端数据格式）
const mockDeviceData = [
  {
    id: 1,
    deviceName: '1号楼水压',
    deviceType: 'PRESSURE',
    deviceCode: 'P001',
    installationLocation: '1号楼天台',
    todayWaterAmount: 0,
    monthlyWaterAmount: 0,
    currentPressure: 0.45,
    status: 'ONLINE',
    updatedAt: new Date(),
    deviceDescription: '1号楼顶层水压监测',
    cumulativeUsage: '0.00',
    baudRate: '4800',
    dataBits: '7',
    stopBits: '2',
    parity: 'E',
    protocolType: 'DLT645',
    createTime: new Date(Date.now() - 86400000 * 30)
  },
]


// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1
  getAllDeviceList();
}

// 重置搜索
const resetQuery = () => {
  // 重置查询参数
  queryParams.deviceName = ''
  queryParams.type = ''
  queryParams.status = ''
  queryParams.pageNum = 1
  //重新发送请求
  getAllDeviceList(queryParams)
}

// 编辑设备
const handleEdit = (row) => {
  reset()
  // 直接使用传入的行数据
  Object.assign(form, row)
  editOpen.value = true
  title.value = '修改设备'
}


// 添加设备
const handleAdd = () => {
  reset()
  editOpen.value = true
  title.value = '添加设备'
}


// 查看设备详情
const handleView = (row) => {
  console.log('查看设备详情', row)
  // 直接使用传入的行数据
  Object.assign(viewForm, row)
  viewOpen.value = true
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
  }).then(async () => {
    try {
      // 调用后端删除API
      deleteDevice(row.deviceCode);

      // 重新获取列表
      await getAllDeviceList()
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除设备失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 设备卡片点击
const handleDeviceClick = (device) => {
  if (device.deviceType === 'WATER') {
    // 水表点击打开专门的水表详情对话框
    Object.assign(waterMeterDetailForm, device)
    waterMeterDetailOpen.value = true
    // 等待对话框打开后初始化图表
    nextTick(() => {
      initWaterUsageChart()
    })
  } else {
    // 其他设备类型打开通用详情对话框
    Object.assign(viewForm, device)
    viewOpen.value = true
  }
}


// 重置表单
const reset = () => {
  form.id = null
  form.deviceName = ''
  form.deviceType = ''
  form.deviceCode = ''
  form.installationLocation = ''
  form.deviceDescription = ''
  form.status = 'OFFLINE'
  form.cumulativeUsage = 0
  form.baudRate = '9600'
  form.dataBits = '8'
  form.stopBits = '1'
  form.parity = ''
  form.protocolType = 'modbus_rtu'
}

// 取消
const cancel = () => {
  editOpen.value = false
  reset()
}

// 提交表单
const submitForm = async (a, b) => {
  console.log("a:", a, b)
  try {
    if (form.id) {
      console.log("修改设备：", form.id)
      // 编辑设备
      const res = await updateDevice(form)
      console.log("修改成功：", res)

      ElMessage.success('修改成功')
    } else {
      // 新增设备
      const res = await addDevice(form)
      console.log("新增成功：", res)

      // // 暂时添加到本地数据
      // const newDevice = {
      //   ...form,
      //   id: Date.now(),
      //   todayWaterAmount: form.deviceType === 'WATER' ? parseFloat(form.cumulativeUsage || 0) * 0.1 : 0,
      //   monthlyWaterAmount: form.deviceType === 'WATER' ? parseFloat(form.cumulativeUsage || 0) : 0,
      //   currentPressure: form.deviceType === 'PRESSURE' ? (Math.random() * 0.5 + 0.2).toFixed(2) : null,
      //   updatedAt: new Date(),
      //   createTime: new Date()
      // }
      // deviceList.value.push(newDevice)
      ElMessage.success('新增成功')
    }

    editOpen.value = false
    // 重新获取列表
    await getAllDeviceList()
    reset()
  } catch (error) {
    console.error('保存设备失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  }
}

// 获取设备类型名称
const getDeviceTypeName = (type) => {
  const typeMap = {
    'WATER': '水表',
    'PRESSURE': '水压表'
  }
  return typeMap[type] || '未知'
}

// 获取设备图标
const getDeviceIcon = (type) => {
  const iconMap = {
    'WATER': Monitor,
    'PRESSURE': OfficeBuilding
  }
  return iconMap[type] || Monitor
}

// 获取设备图标颜色
const getDeviceIconColor = (type, status) => {
  if (status === 'OFFLINE') return '#909399'

  const colorMap = {
    'WATER': '#409EFF',
    'PRESSURE': '#67C23A'
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
    'O': '奇校验',
    'E': '偶校验'
  }
  return parityMap[parity] || '未知'
}

// 获取协议类型名称
const getProtocolName = (protocol) => {
  const protocolMap = {
    'MODBUS': 'Modbus',
    'DLT645': 'DL/T 645',
    'CUSTOM': '自定义协议'
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
    dates.push(date.toLocaleDateString('zh-CN', {month: '2-digit', day: '2-digit'}))

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
      formatter: function (params) {
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
