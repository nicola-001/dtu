<template>
  <div class="app-container">
    <div class="config-header">
      <h2>系统配置管理</h2>
      <p>请选择需要配置的系统参数，生成自定义配置文件</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧配置选项 -->
      <el-col :span="18">
        <div class="config-content">
          <!-- 基础配置 -->
          <el-card class="config-section" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-checkbox
                  v-model="configSections.basic.enabled"
                  @change="toggleSection('basic')"
                  class="section-checkbox"
                >
                  基础配置
                </el-checkbox>
                <span class="section-description">系统基本参数设置</span>
              </div>
            </template>

            <div v-show="configSections.basic.enabled" class="config-items">
              <el-row :gutter="20">
                <el-col :span="12" v-for="item in basicConfigItems" :key="item.key">
                  <div class="config-item">
                    <el-checkbox
                      v-model="item.checked"
                      @change="updateConfigItem('basic', item.key, $event)"
                    >
                      {{ item.label }}
                    </el-checkbox>
                    <div class="item-description">{{ item.description }}</div>
                    <div v-if="item.checked && item.hasValue" class="item-value">
                      <el-input
                        v-if="item.type === 'input'"
                        v-model="item.value"
                        :placeholder="item.placeholder"
                        size="small"
                      />
                      <el-select
                        v-else-if="item.type === 'select'"
                        v-model="item.value"
                        :placeholder="item.placeholder"
                        size="small"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="option in item.options"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                      <el-input-number
                        v-else-if="item.type === 'number'"
                        v-model="item.value"
                        :min="item.min"
                        :max="item.max"
                        size="small"
                        style="width: 100%"
                      />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>

          <!-- 数据库配置 -->
          <el-card class="config-section" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-checkbox
                  v-model="configSections.database.enabled"
                  @change="toggleSection('database')"
                  class="section-checkbox"
                >
                  数据库配置
                </el-checkbox>
                <span class="section-description">数据库连接参数设置</span>
              </div>
            </template>

            <div v-show="configSections.database.enabled" class="config-items">
              <el-row :gutter="20">
                <el-col :span="12" v-for="item in databaseConfigItems" :key="item.key">
                  <div class="config-item">
                    <el-checkbox
                      v-model="item.checked"
                      @change="updateConfigItem('database', item.key, $event)"
                    >
                      {{ item.label }}
                    </el-checkbox>
                    <div class="item-description">{{ item.description }}</div>
                    <div v-if="item.checked && item.hasValue" class="item-value">
                      <el-input
                        v-if="item.type === 'input'"
                        v-model="item.value"
                        :placeholder="item.placeholder"
                        :type="item.inputType || 'text'"
                        size="small"
                      />
                      <el-input-number
                        v-else-if="item.type === 'number'"
                        v-model="item.value"
                        :min="item.min"
                        :max="item.max"
                        size="small"
                        style="width: 100%"
                      />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>

          <!-- 通信配置 -->
          <el-card class="config-section" shadow="hover">
            <template #header>
              <div class="section-header">
                <el-checkbox
                  v-model="configSections.communication.enabled"
                  @change="toggleSection('communication')"
                  class="section-checkbox"
                >
                  通信配置
                </el-checkbox>
                <span class="section-description">设备通信参数设置</span>
              </div>
            </template>

            <div v-show="configSections.communication.enabled" class="config-items">
              <el-row :gutter="20">
                <el-col :span="12" v-for="item in communicationConfigItems" :key="item.key">
                  <div class="config-item">
                    <el-checkbox
                      v-model="item.checked"
                      @change="updateConfigItem('communication', item.key, $event)"
                    >
                      {{ item.label }}
                    </el-checkbox>
                    <div class="item-description">{{ item.description }}</div>
                    <div v-if="item.checked && item.hasValue" class="item-value">
                      <el-select
                        v-if="item.type === 'select'"
                        v-model="item.value"
                        :placeholder="item.placeholder"
                        size="small"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="option in item.options"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                      <el-input
                        v-else-if="item.type === 'input'"
                        v-model="item.value"
                        :placeholder="item.placeholder"
                        size="small"
                      />
                      <el-input-number
                        v-else-if="item.type === 'number'"
                        v-model="item.value"
                        :min="item.min"
                        :max="item.max"
                        size="small"
                        style="width: 100%"
                      />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </div>
      </el-col>

      <!-- 右侧操作面板 -->
      <el-col :span="6">
        <div class="operation-panel">
          <el-card class="operation-card" shadow="always">
            <template #header>
              <div class="operation-header">
                <el-icon><Setting /></el-icon>
                <span>配置操作</span>
              </div>
            </template>

            <div class="operation-content">
              <!-- 配置预览 -->
              <div class="config-preview">
                <h4>已选配置项</h4>
                <div class="preview-list">
                  <div v-for="section in getSelectedSections()" :key="section.key" class="preview-section">
                    <div class="preview-section-title">{{ section.title }}</div>
                    <div class="preview-items">
                      <el-tag
                        v-for="item in section.items"
                        :key="item.key"
                        size="small"
                        class="preview-tag"
                      >
                        {{ item.label }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 配置文件设置 -->
              <el-divider />
              <div class="file-settings">
                <h4>文件设置</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="文件名">
                    <el-input
                      v-model="configFileName"
                      placeholder="config"
                      suffix-icon="Document"
                    />
                  </el-form-item>
                  <el-form-item label="文件格式">
                    <el-select v-model="configFileFormat" style="width: 100%">
                      <el-option label="JSON" value="json" />
                      <el-option label="YAML" value="yaml" />
                      <el-option label="INI" value="ini" />
                      <el-option label="XML" value="xml" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="保存路径">
                    <el-input
                      v-model="configSavePath"
                      placeholder="/config/"
                      readonly
                    >
                      <template #append>
                        <el-button @click="selectSavePath" icon="Folder">选择</el-button>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-form>
              </div>

              <!-- 操作按钮 -->
              <el-divider />
              <div class="operation-buttons">
                <el-button
                  type="primary"
                  icon="Download"
                  @click="generateAndDownload"
                  :disabled="!hasSelectedItems"
                  block
                >
                  生成并下载配置文件
                </el-button>
                <el-button
                  type="success"
                  icon="View"
                  @click="previewConfig"
                  :disabled="!hasSelectedItems"
                  block
                >
                  预览配置内容
                </el-button>
                <el-button
                  type="warning"
                  icon="Refresh"
                  @click="resetConfig"
                  block
                >
                  重置配置
                </el-button>
                <el-button
                  type="info"
                  icon="Upload"
                  @click="importConfig"
                  block
                >
                  导入配置文件
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 配置预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="配置文件预览" width="800px">
      <el-tabs v-model="previewActiveTab">
        <el-tab-pane label="格式化预览" name="formatted">
          <pre class="config-preview-content">{{ formattedConfigContent }}</pre>
        </el-tab-pane>
        <el-tab-pane label="原始内容" name="raw">
          <el-input
            v-model="rawConfigContent"
            type="textarea"
            :rows="20"
            readonly
            class="config-raw-content"
          />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="copyConfigContent">复制内容</el-button>
          <el-button type="success" @click="downloadFromPreview">下载文件</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 文件上传对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入配置文件" width="600px">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :accept="'.json,.yaml,.yml,.ini,.xml'"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将配置文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 JSON、YAML、INI、XML 格式的配置文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImport">确认导入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ConfigManagement">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting,
  Download,
  View,
  Refresh,
  Upload,
  Document,
  Folder,
  UploadFilled
} from '@element-plus/icons-vue'

// 响应式数据
const previewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const previewActiveTab = ref('formatted')
const configFileName = ref('system_config')
const configFileFormat = ref('json')
const configSavePath = ref('/config/')
const rawConfigContent = ref('')
const uploadRef = ref(null)
const importedFile = ref(null)

// 配置分组
const configSections = reactive({
  basic: { enabled: false },
  database: { enabled: false },
  communication: { enabled: false },
  logging: { enabled: false }
})

// 基础配置项
const basicConfigItems = reactive([
  {
    key: 'appName',
    label: '应用名称',
    description: '系统应用的名称标识',
    checked: false,
    hasValue: true,
    type: 'input',
    value: 'DTU管理系统',
    placeholder: '请输入应用名称'
  },
  {
    key: 'appVersion',
    label: '应用版本',
    description: '当前系统版本号',
    checked: false,
    hasValue: true,
    type: 'input',
    value: '1.0.0',
    placeholder: '请输入版本号'
  },
  {
    key: 'environment',
    label: '运行环境',
    description: '系统运行环境配置',
    checked: false,
    hasValue: true,
    type: 'select',
    value: 'production',
    placeholder: '请选择环境',
    options: [
      { label: '开发环境', value: 'development' },
      { label: '测试环境', value: 'testing' },
      { label: '生产环境', value: 'production' }
    ]
  },
  {
    key: 'serverPort',
    label: '服务端口',
    description: '系统服务监听端口',
    checked: false,
    hasValue: true,
    type: 'number',
    value: 8080,
    min: 1000,
    max: 65535,
    placeholder: '请输入端口号'
  },
  {
    key: 'maxConnections',
    label: '最大连接数',
    description: '系统支持的最大并发连接数',
    checked: false,
    hasValue: true,
    type: 'number',
    value: 1000,
    min: 10,
    max: 10000,
    placeholder: '请输入最大连接数'
  },
  {
    key: 'timezone',
    label: '时区设置',
    description: '系统默认时区配置',
    checked: false,
    hasValue: true,
    type: 'select',
    value: 'Asia/Shanghai',
    placeholder: '请选择时区',
    options: [
      { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
      { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
      { label: '纽约时间 (UTC-5)', value: 'America/New_York' },
      { label: '伦敦时间 (UTC+0)', value: 'Europe/London' }
    ]
  }
])

// 数据库配置项
const databaseConfigItems = reactive([
  {
    key: 'dbHost',
    label: '数据库主机',
    description: '数据库服务器地址',
    checked: false,
    hasValue: true,
    type: 'input',
    value: 'localhost',
    placeholder: '请输入数据库主机地址'
  },
  {
    key: 'dbPort',
    label: '数据库端口',
    description: '数据库服务端口',
    checked: false,
    hasValue: true,
    type: 'number',
    value: 3306,
    min: 1,
    max: 65535,
    placeholder: '请输入数据库端口'
  },
  {
    key: 'dbName',
    label: '数据库名称',
    description: '连接的数据库名称',
    checked: false,
    hasValue: true,
    type: 'input',
    value: 'dtu_system',
    placeholder: '请输入数据库名称'
  },
  {
    key: 'dbUsername',
    label: '数据库用户名',
    description: '数据库连接用户名',
    checked: false,
    hasValue: true,
    type: 'input',
    value: 'root',
    placeholder: '请输入用户名'
  },
  {
    key: 'dbPassword',
    label: '数据库密码',
    description: '数据库连接密码',
    checked: false,
    hasValue: true,
    type: 'input',
    inputType: 'password',
    value: '',
    placeholder: '请输入密码'
  },
  {
    key: 'dbPoolSize',
    label: '连接池大小',
    description: '数据库连接池最大连接数',
    checked: false,
    hasValue: true,
    type: 'number',
    value: 20,
    min: 1,
    max: 100,
    placeholder: '请输入连接池大小'
  }
])

// 通信配置项
const communicationConfigItems = reactive([
  {
    key: 'serialPort',
    label: '串口设备',
    description: '串口通信设备路径',
    checked: false,
    hasValue: true,
    type: 'input',
    value: '/dev/ttyUSB0',
    placeholder: '请输入串口设备路径'
  },
  {
    key: 'baudRate',
    label: '波特率',
    description: '串口通信波特率',
    checked: false,
    hasValue: true,
    type: 'select',
    value: '9600',
    placeholder: '请选择波特率',
    options: [
      { label: '9600', value: '9600' },
      { label: '19200', value: '19200' },
      { label: '38400', value: '38400' },
      { label: '57600', value: '57600' },
      { label: '115200', value: '115200' }
    ]
  },
  {
    key: 'dataBits',
    label: '数据位',
    description: '串口数据位设置',
    checked: false,
    hasValue: true,
    type: 'select',
    value: '8',
    placeholder: '请选择数据位',
    options: [
      { label: '7位', value: '7' },
      { label: '8位', value: '8' }
    ]
  },
  {
    key: 'stopBits',
    label: '停止位',
    description: '串口停止位设置',
    checked: false,
    hasValue: true,
    type: 'select',
    value: '1',
    placeholder: '请选择停止位',
    options: [
      { label: '1位', value: '1' },
      { label: '1.5位', value: '1.5' },
      { label: '2位', value: '2' }
    ]
  },
  {
    key: 'parity',
    label: '校验位',
    description: '串口校验位设置',
    checked: false,
    hasValue: true,
    type: 'select',
    value: 'none',
    placeholder: '请选择校验位',
    options: [
      { label: '无校验', value: 'none' },
      { label: '奇校验', value: 'odd' },
      { label: '偶校验', value: 'even' }
    ]
  },
  {
    key: 'timeout',
    label: '通信超时',
    description: '通信超时时间(秒)',
    checked: false,
    hasValue: true,
    type: 'number',
    value: 30,
    min: 1,
    max: 300,
    placeholder: '请输入超时时间'
  }
])

// 日志配置项
const loggingConfigItems = reactive([
  {
    key: 'logLevel',
    label: '日志级别',
    description: '系统日志记录级别',
    checked: false,
    hasValue: true,
    type: 'select',
    value: 'info',
    placeholder: '请选择日志级别',
    options: [
      { label: 'DEBUG', value: 'debug' },
      { label: 'INFO', value: 'info' },
      { label: 'WARN', value: 'warn' },
      { label: 'ERROR', value: 'error' }
    ]
  },
  {
    key: 'logPath',
    label: '日志路径',
    description: '日志文件存储路径',
    checked: false,
    hasValue: true,
    type: 'input',
    value: '/var/log/dtu/',
    placeholder: '请输入日志路径'
  },
  {
    key: 'maxLogSize',
    label: '最大日志大小',
    description: '单个日志文件最大大小(MB)',
    checked: false,
    hasValue: true,
    type: 'number',
    value: 100,
    min: 1,
    max: 1000,
    placeholder: '请输入最大日志大小'
  },
  {
    key: 'logRotation',
    label: '日志轮转',
    description: '是否启用日志文件轮转',
    checked: false,
    hasValue: true,
    type: 'switch',
    value: true
  },
  {
    key: 'retentionDays',
    label: '保留天数',
    description: '日志文件保留天数',
    checked: false,
    hasValue: true,
    type: 'number',
    value: 30,
    min: 1,
    max: 365,
    placeholder: '请输入保留天数'
  },
  {
    key: 'consoleOutput',
    label: '控制台输出',
    description: '是否在控制台输出日志',
    checked: false,
    hasValue: true,
    type: 'switch',
    value: true
  }
])

// 计算属性
const hasSelectedItems = computed(() => {
  const allItems = [
    ...basicConfigItems,
    ...databaseConfigItems,
    ...communicationConfigItems,
    ...loggingConfigItems
  ]
  return allItems.some(item => item.checked)
})

const formattedConfigContent = computed(() => {
  const config = generateConfigObject()
  return JSON.stringify(config, null, 2)
})

// 方法
const toggleSection = (sectionKey) => {
  const section = configSections[sectionKey]
  if (!section.enabled) {
    // 如果禁用分组，则取消选中该分组下的所有配置项
    const items = getSectionItems(sectionKey)
    items.forEach(item => {
      item.checked = false
    })
  }
}

const updateConfigItem = (sectionKey, itemKey, checked) => {
  // 配置项状态更新逻辑
  console.log(`${sectionKey}.${itemKey} = ${checked}`)
}

const getSectionItems = (sectionKey) => {
  const itemsMap = {
    basic: basicConfigItems,
    database: databaseConfigItems,
    communication: communicationConfigItems,
    logging: loggingConfigItems
  }
  return itemsMap[sectionKey] || []
}

const getSelectedSections = () => {
  const sections = []

  if (configSections.basic.enabled) {
    const selectedItems = basicConfigItems.filter(item => item.checked)
    if (selectedItems.length > 0) {
      sections.push({
        key: 'basic',
        title: '基础配置',
        items: selectedItems
      })
    }
  }

  if (configSections.database.enabled) {
    const selectedItems = databaseConfigItems.filter(item => item.checked)
    if (selectedItems.length > 0) {
      sections.push({
        key: 'database',
        title: '数据库配置',
        items: selectedItems
      })
    }
  }

  if (configSections.communication.enabled) {
    const selectedItems = communicationConfigItems.filter(item => item.checked)
    if (selectedItems.length > 0) {
      sections.push({
        key: 'communication',
        title: '通信配置',
        items: selectedItems
      })
    }
  }

  if (configSections.logging.enabled) {
    const selectedItems = loggingConfigItems.filter(item => item.checked)
    if (selectedItems.length > 0) {
      sections.push({
        key: 'logging',
        title: '日志配置',
        items: selectedItems
      })
    }
  }

  return sections
}

const generateConfigObject = () => {
  const config = {}

  // 基础配置
  if (configSections.basic.enabled) {
    const basicConfig = {}
    basicConfigItems.forEach(item => {
      if (item.checked) {
        basicConfig[item.key] = item.value
      }
    })
    if (Object.keys(basicConfig).length > 0) {
      config.basic = basicConfig
    }
  }

  // 数据库配置
  if (configSections.database.enabled) {
    const dbConfig = {}
    databaseConfigItems.forEach(item => {
      if (item.checked) {
        dbConfig[item.key] = item.value
      }
    })
    if (Object.keys(dbConfig).length > 0) {
      config.database = dbConfig
    }
  }

  // 通信配置
  if (configSections.communication.enabled) {
    const commConfig = {}
    communicationConfigItems.forEach(item => {
      if (item.checked) {
        commConfig[item.key] = item.value
      }
    })
    if (Object.keys(commConfig).length > 0) {
      config.communication = commConfig
    }
  }

  // 日志配置
  if (configSections.logging.enabled) {
    const logConfig = {}
    loggingConfigItems.forEach(item => {
      if (item.checked) {
        logConfig[item.key] = item.value
      }
    })
    if (Object.keys(logConfig).length > 0) {
      config.logging = logConfig
    }
  }

  return config
}

const formatConfigContent = (config, format) => {
  switch (format) {
    case 'json':
      return JSON.stringify(config, null, 2)
    case 'yaml':
      // 简单的YAML格式化（实际项目中建议使用js-yaml库）
      return convertToYaml(config)
    case 'ini':
      return convertToIni(config)
    case 'xml':
      return convertToXml(config)
    default:
      return JSON.stringify(config, null, 2)
  }
}

const convertToYaml = (obj, indent = 0) => {
  let yaml = ''
  const spaces = '  '.repeat(indent)

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`
      yaml += convertToYaml(value, indent + 1)
    } else {
      yaml += `${spaces}${key}: ${value}\n`
    }
  }

  return yaml
}

const convertToIni = (obj) => {
  let ini = ''

  for (const [section, values] of Object.entries(obj)) {
    ini += `[${section}]\n`
    for (const [key, value] of Object.entries(values)) {
      ini += `${key}=${value}\n`
    }
    ini += '\n'
  }

  return ini
}

const convertToXml = (obj) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<config>\n'

  for (const [section, values] of Object.entries(obj)) {
    xml += `  <${section}>\n`
    for (const [key, value] of Object.entries(values)) {
      xml += `    <${key}>${value}</${key}>\n`
    }
    xml += `  </${section}>\n`
  }

  xml += '</config>'
  return xml
}

// 操作方法
const selectSavePath = () => {
  ElMessage.info('在实际项目中，这里会打开文件夹选择对话框')
  // 在实际项目中，可以使用 Electron 的 dialog.showOpenDialog 或浏览器的文件API
}

const generateAndDownload = () => {
  if (!hasSelectedItems.value) {
    ElMessage.warning('请先选择要配置的项目')
    return
  }

  const config = generateConfigObject()
  const content = formatConfigContent(config, configFileFormat.value)
  const fileName = `${configFileName.value}.${configFileFormat.value}`

  // 创建下载链接
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success(`配置文件 ${fileName} 已生成并下载`)
}

const previewConfig = () => {
  if (!hasSelectedItems.value) {
    ElMessage.warning('请先选择要配置的项目')
    return
  }

  const config = generateConfigObject()
  rawConfigContent.value = formatConfigContent(config, configFileFormat.value)
  previewDialogVisible.value = true
}

const copyConfigContent = async () => {
  try {
    await navigator.clipboard.writeText(rawConfigContent.value)
    ElMessage.success('配置内容已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const downloadFromPreview = () => {
  const fileName = `${configFileName.value}.${configFileFormat.value}`
  const blob = new Blob([rawConfigContent.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success(`配置文件 ${fileName} 已下载`)
}

const resetConfig = () => {
  ElMessageBox.confirm('确定要重置所有配置吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 重置所有分组
    Object.keys(configSections).forEach(key => {
      configSections[key].enabled = false
    })

    // 重置所有配置项
    const allItems = [
      ...basicConfigItems,
      ...databaseConfigItems,
      ...communicationConfigItems,
      ...loggingConfigItems
    ]
    allItems.forEach(item => {
      item.checked = false
    })

    // 重置文件设置
    configFileName.value = 'system_config'
    configFileFormat.value = 'json'
    configSavePath.value = '/config/'

    ElMessage.success('配置已重置')
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}

const importConfig = () => {
  importDialogVisible.value = true
}

const handleFileChange = (file) => {
  importedFile.value = file
}

const confirmImport = () => {
  if (!importedFile.value) {
    ElMessage.warning('请选择要导入的配置文件')
    return
  }

  const file = importedFile.value.raw
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const content = e.target.result
      let config = {}

      // 根据文件扩展名解析配置
      const extension = file.name.split('.').pop().toLowerCase()

      switch (extension) {
        case 'json':
          config = JSON.parse(content)
          break
        case 'yaml':
        case 'yml':
          // 实际项目中建议使用 js-yaml 库
          ElMessage.warning('YAML 格式导入功能需要额外的库支持')
          return
        case 'ini':
          ElMessage.warning('INI 格式导入功能开发中')
          return
        case 'xml':
          ElMessage.warning('XML 格式导入功能开发中')
          return
        default:
          ElMessage.error('不支持的文件格式')
          return
      }

      // 应用导入的配置
      applyImportedConfig(config)
      importDialogVisible.value = false
      ElMessage.success('配置文件导入成功')

    } catch (error) {
      ElMessage.error('配置文件格式错误，导入失败')
    }
  }

  reader.readAsText(file)
}

const applyImportedConfig = (config) => {
  // 重置当前配置
  Object.keys(configSections).forEach(key => {
    configSections[key].enabled = false
  })

  // 应用导入的配置
  Object.keys(config).forEach(sectionKey => {
    if (configSections[sectionKey]) {
      configSections[sectionKey].enabled = true

      const items = getSectionItems(sectionKey)
      const sectionConfig = config[sectionKey]

      items.forEach(item => {
        if (sectionConfig.hasOwnProperty(item.key)) {
          item.checked = true
          item.value = sectionConfig[item.key]
        }
      })
    }
  })
}

// 组件挂载
onMounted(() => {
  // 初始化默认配置
  console.log('配置管理页面已加载')
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.config-header {
  margin-bottom: 20px;
  text-align: center;

  h2 {
    margin: 0 0 10px 0;
    color: #303133;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }
}

.config-content {
  .config-section {
    margin-bottom: 20px;

    :deep(.el-card__header) {
      padding: 16px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #ebeef5;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }
}

.section-header {
  display: flex;
  align-items: center;

  .section-checkbox {
    margin-right: 12px;
    font-weight: 600;
    font-size: 16px;
  }

  .section-description {
    color: #909399;
    font-size: 14px;
  }
}

.config-items {
  margin-top: 16px;
}

.config-item {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;

  &:hover {
    border-color: #c0c4cc;
    background: #f5f7fa;
  }

  .item-description {
    margin: 4px 0 8px 24px;
    font-size: 12px;
    color: #909399;
  }

  .item-value {
    margin: 8px 0 0 24px;
  }
}

.operation-panel {
  position: sticky;
  top: 20px;
}

.operation-card {
  :deep(.el-card__header) {
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.operation-header {
  display: flex;
  align-items: center;
  color: white;

  .el-icon {
    margin-right: 8px;
    font-size: 18px;
  }

  span {
    font-weight: 600;
    font-size: 16px;
  }
}

.operation-content {
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #303133;
    font-weight: 600;
  }
}

.config-preview {
  .preview-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .preview-section {
    margin-bottom: 12px;

    .preview-section-title {
      font-size: 13px;
      font-weight: 600;
      color: #409eff;
      margin-bottom: 6px;
    }

    .preview-items {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .preview-tag {
        margin: 0;
      }
    }
  }
}

.file-settings {
  .el-form-item {
    margin-bottom: 12px;
  }
}

.operation-buttons {
  .el-button {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.config-preview-content {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.config-raw-content {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.upload-demo {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 180px;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .operation-panel {
    position: static;
    margin-top: 20px;
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }

  .config-item {
    .item-description,
    .item-value {
      margin-left: 0;
    }
  }
}

// 暗色主题适配
html.dark {
  .config-header {
    h2 {
      color: var(--el-text-color-primary);
    }

    p {
      color: var(--el-text-color-regular);
    }
  }

  .config-item {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);

    &:hover {
      background: var(--el-bg-color);
      border-color: var(--el-border-color-light);
    }
  }

  .operation-content {
    h4 {
      color: var(--el-text-color-primary);
    }
  }

  .preview-section-title {
    color: var(--el-color-primary) !important;
  }

  .config-preview-content {
    background: var(--el-bg-color-overlay);
    color: var(--el-text-color-primary);
  }
}
</style>