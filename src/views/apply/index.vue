<template>
  <div class="app-container">
    <!-- 顶部操作栏 -->
    <div class="top-toolbar">
      <el-row justify="space-between" align="middle">
        <el-col :span="12">
          <div class="page-title">
            <h2>应用</h2>
            <p>管理和上传您的配置文件到应用商城</p>
          </div>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button
            type="primary"
            icon="Shop"
            size="large"
            @click="goToMarketplace"
          >
            前往商城
          </el-button>
        </el-col>
      </el-row>
    </div>



    <!-- 已上传文件列表 -->
    <div class="file-list-section">
      <el-card class="file-list-card" shadow="never">
        <template #header>
          <div class="section-header">
            <div class="header-left">
              <el-icon><Files /></el-icon>
              <span>已上传的配置文件</span>
              <el-tag size="small" type="info">{{ uploadedFiles.length }} 个文件</el-tag>
            </div>
            <div class="header-right">
              <el-button
                type="primary"
                icon="Refresh"
                @click="refreshFileList"
                size="small"
              >
                刷新列表
              </el-button>
            </div>
          </div>
        </template>

        <div class="file-list-content">
          <el-table
            :data="uploadedFiles"
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa' }"
          >
            <el-table-column prop="name" label="文件名" min-width="200">
              <template #default="{ row }">
                <div class="file-name">
                  <el-icon :color="getFileIconColor(row.type)">
                    <component :is="getFileIcon(row.type)" />
                  </el-icon>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="文件类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getFileTypeTag(row.type)" size="small">
                  {{ row.type.toUpperCase() }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="文件大小" width="120">
              <template #default="{ row }">
                <span>{{ formatFileSize(row.size) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="uploadTime" label="上传时间" width="180">
              <template #default="{ row }">
                <span>{{ formatTime(row.uploadTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="300" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  icon="View"
                  size="small"
                  @click="viewFile(row)"
                >
                  查看
                </el-button>
                <el-button
                  type="success"
                  icon="Download"
                  size="small"
                  @click="downloadFile(row)"
                >
                  下载
                </el-button>
                <el-button
                  type="danger"
                  icon="Delete"
                  size="small"
                  @click="deleteFile(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 空状态 -->
          <el-empty
            v-if="!uploadedFiles.length"
            description="暂无上传的配置文件"
            :image-size="120"
          >
            <el-button type="primary" @click="openTerminal">开始上传配置文件</el-button>
          </el-empty>
        </div>
      </el-card>
    </div>

    <!-- 终端界面 -->
    <div class="terminal-section">
      <el-card class="terminal-card" shadow="never">
        <template #header>
          <div class="terminal-header">
            <div class="terminal-title">
              <el-icon><Monitor /></el-icon>
              <span>配置文件上传终端</span>
            </div>
            <div class="terminal-controls">
              <el-button
                type="text"
                icon="RefreshRight"
                @click="clearTerminal"
                size="small"
              >
                清空
              </el-button>
              <el-button
                type="text"
                icon="FullScreen"
                @click="toggleFullscreen"
                size="small"
              >
                全屏
              </el-button>
            </div>
          </div>
        </template>

        <div class="terminal-content" ref="terminalRef" @click="focusTerminal">
          <!-- 终端历史记录 -->
          <div class="terminal-history">
            <div
              v-for="(item, index) in terminalHistory"
              :key="index"
              class="terminal-line"
              :class="item.type"
            >
              <span v-if="item.type === 'command'" class="terminal-prompt">
                {{ currentUser }}$:
              </span>
              <span class="terminal-text">{{ item.content }}</span>
            </div>
          </div>

          <!-- 当前输入行 -->
          <div class="terminal-input-line">
            <span class="terminal-prompt">{{ currentUser }}$:</span>
            <input
              ref="terminalInput"
              v-model="currentCommand"
              @keyup.enter="executeCommand"
              @keyup.up="navigateHistory('up')"
              @keyup.down="navigateHistory('down')"
              @keyup.tab.prevent="autoComplete"
              class="terminal-input"
              placeholder="输入命令上传配置文件..."
              autofocus
            />
            <span class="terminal-cursor" :class="{ blink: cursorBlink }">|</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup name="ApplyManagement">
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Shop,
  Files,
  Monitor,
  Refresh,
  View,
  Delete,
  RefreshRight,
  FullScreen,
  Document,
  FolderOpened
} from '@element-plus/icons-vue'

// 响应式数据
const terminalRef = ref(null)
const terminalInput = ref(null)
const currentCommand = ref('')
const currentUser = ref('admin')
const cursorBlink = ref(true)
const commandHistory = ref([])
const historyIndex = ref(-1)
const isFullscreen = ref(false)

// 终端历史记录
const terminalHistory = reactive([
  { type: 'info', content: '欢迎使用配置文件上传终端' },
  { type: 'info', content: '输入 "help" 查看可用命令' },
  { type: 'info', content: '输入 "upload <filename>" 上传配置文件' }
])

// 已上传文件列表
const uploadedFiles = reactive([
  {
    id: 1,
    name: 'database_config.json',
    type: 'json',
    size: 2048,
    uploadTime: new Date(Date.now() - 86400000)
  },
  {
    id: 2,
    name: 'communication_settings.yaml',
    type: 'yaml',
    size: 1536,
    uploadTime: new Date(Date.now() - 172800000)
  },
  {
    id: 3,
    name: 'logging_config.ini',
    type: 'ini',
    size: 1024,
    uploadTime: new Date(Date.now() - 259200000)
  },
  {
    id: 4,
    name: 'system_config.xml',
    type: 'xml',
    size: 3072,
    uploadTime: new Date(Date.now() - 345600000)
  }
])

// 可用命令列表
const availableCommands = [
  'help', 'upload', 'list', 'clear', 'status', 'delete', 'download', 'git'
]

// 光标闪烁定时器
let cursorTimer = null

// 方法
const goToMarketplace = () => {
  ElMessage.info('正在跳转到应用商城...')
  // 这里可以添加实际的跳转逻辑
  window.open('https://marketplace.dtu.com', '_blank')
}



const refreshFileList = () => {
  ElMessage.success('文件列表已刷新')
  // 这里可以添加实际的刷新逻辑
}

const getFileIcon = (type) => {
  const iconMap = {
    json: Document,
    yaml: Document,
    ini: Document,
    xml: Document
  }
  return iconMap[type] || Document
}

const getFileIconColor = (type) => {
  const colorMap = {
    json: '#409EFF',
    yaml: '#67C23A',
    ini: '#E6A23C',
    xml: '#F56C6C'
  }
  return colorMap[type] || '#909399'
}

const getFileTypeTag = (type) => {
  const tagMap = {
    json: 'primary',
    yaml: 'success',
    ini: 'warning',
    xml: 'danger'
  }
  return tagMap[type] || 'info'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 文件操作方法
const viewFile = (file) => {
  ElMessage.info(`查看文件: ${file.name}`)
  // 这里可以添加文件预览逻辑
}

const downloadFile = (file) => {
  ElMessage.success(`开始下载: ${file.name}`)
  // 这里可以添加文件下载逻辑
}

const deleteFile = (file) => {
  ElMessageBox.confirm(`确定要删除文件 "${file.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = uploadedFiles.findIndex(f => f.id === file.id)
    if (index > -1) {
      uploadedFiles.splice(index, 1)
      ElMessage.success('文件删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 终端相关方法
const focusTerminal = () => {
  if (terminalInput.value) {
    terminalInput.value.focus()
  }
}

const clearTerminal = () => {
  terminalHistory.splice(0, terminalHistory.length)
  terminalHistory.push(
    { type: 'info', content: '终端已清空' },
    { type: 'info', content: '输入 "help" 查看可用命令' }
  )
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  const terminalCard = document.querySelector('.terminal-card')
  if (isFullscreen.value) {
    terminalCard.classList.add('fullscreen')
    ElMessage.info('已进入全屏模式，按 ESC 退出')
  } else {
    terminalCard.classList.remove('fullscreen')
  }
}

const openTerminal = () => {
  nextTick(() => {
    focusTerminal()
    const terminalSection = document.querySelector('.terminal-section')
    terminalSection.scrollIntoView({ behavior: 'smooth' })
  })
}

const executeCommand = () => {
  const command = currentCommand.value.trim()
  if (!command) return

  // 添加到历史记录
  commandHistory.value.push(command)
  historyIndex.value = commandHistory.value.length

  // 显示执行的命令
  terminalHistory.push({
    type: 'command',
    content: command
  })

  // 解析并执行命令
  const [cmd, ...args] = command.split(' ')
  executeTerminalCommand(cmd.toLowerCase(), args)

  // 清空当前命令
  currentCommand.value = ''

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

const executeTerminalCommand = (cmd, args) => {
  switch (cmd) {
    case 'help':
      showHelp()
      break
    case 'upload':
      handleUpload(args)
      break
    case 'list':
    case 'ls':
      listFiles()
      break
    case 'clear':
      clearTerminal()
      break
    case 'status':
      showStatus()
      break
    case 'delete':
    case 'rm':
      handleDelete(args)
      break
    case 'download':
      handleDownload(args)
      break
    case 'git':
      handleGitCommand(args)
      break
    case 'pwd':
      terminalHistory.push({
        type: 'output',
        content: '/home/admin/configs'
      })
      break
    case 'whoami':
      terminalHistory.push({
        type: 'output',
        content: currentUser.value
      })
      break
    default:
      terminalHistory.push({
        type: 'error',
        content: `命令未找到: ${cmd}。输入 "help" 查看可用命令。`
      })
  }
}

const showHelp = () => {
  const helpText = [
    '可用命令:',
    '  help                    - 显示此帮助信息',
    '  upload <filename>       - 上传配置文件到商城',
    '  list, ls               - 列出已上传的文件',
    '  status                 - 显示上传状态',
    '  delete <filename>      - 删除指定文件',
    '  download <filename>    - 下载指定文件',
    '  git <subcommand>       - 执行 Git 命令',
    '  clear                  - 清空终端',
    '  pwd                    - 显示当前目录',
    '  whoami                 - 显示当前用户',
    '',
    '示例:',
    '  upload config.json',
    '  git status',
    '  git push origin main'
  ]

  helpText.forEach(line => {
    terminalHistory.push({
      type: 'output',
      content: line
    })
  })
}

const handleUpload = (args) => {
  if (args.length === 0) {
    terminalHistory.push({
      type: 'error',
      content: '错误: 请指定要上传的文件名'
    })
    return
  }

  const filename = args[0]

  // 模拟上传过程
  terminalHistory.push({
    type: 'output',
    content: `正在上传文件: ${filename}...`
  })

  setTimeout(() => {
    // 模拟上传成功
    const newFile = {
      id: Date.now(),
      name: filename,
      type: filename.split('.').pop() || 'txt',
      size: Math.floor(Math.random() * 5000) + 1000,
      uploadTime: new Date()
    }

    uploadedFiles.push(newFile)

    terminalHistory.push({
      type: 'success',
      content: `文件 ${filename} 上传成功！`
    })

    nextTick(() => {
      scrollToBottom()
    })
  }, 2000)
}

const listFiles = () => {
  if (uploadedFiles.length === 0) {
    terminalHistory.push({
      type: 'output',
      content: '暂无已上传的文件'
    })
    return
  }

  terminalHistory.push({
    type: 'output',
    content: '已上传的文件:'
  })

  uploadedFiles.forEach(file => {
    terminalHistory.push({
      type: 'output',
      content: `  ${file.name} (${formatFileSize(file.size)})`
    })
  })
}

const showStatus = () => {
  terminalHistory.push({
    type: 'output',
    content: `文件统计信息:`
  })
  terminalHistory.push({
    type: 'output',
    content: `  总文件数: ${uploadedFiles.length}`
  })

  if (uploadedFiles.length > 0) {
    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0)
    terminalHistory.push({
      type: 'output',
      content: `  总大小: ${formatFileSize(totalSize)}`
    })

    const latestFile = uploadedFiles.reduce((latest, file) =>
      file.uploadTime > latest.uploadTime ? file : latest
    )
    terminalHistory.push({
      type: 'output',
      content: `  最新文件: ${latestFile.name}`
    })
  }
}

const handleDelete = (args) => {
  if (args.length === 0) {
    terminalHistory.push({
      type: 'error',
      content: '错误: 请指定要删除的文件名'
    })
    return
  }

  const filename = args[0]
  const fileIndex = uploadedFiles.findIndex(f => f.name === filename)

  if (fileIndex === -1) {
    terminalHistory.push({
      type: 'error',
      content: `错误: 文件 ${filename} 不存在`
    })
    return
  }

  uploadedFiles.splice(fileIndex, 1)
  terminalHistory.push({
    type: 'success',
    content: `文件 ${filename} 删除成功`
  })
}

const handleDownload = (args) => {
  if (args.length === 0) {
    terminalHistory.push({
      type: 'error',
      content: '错误: 请指定要下载的文件名'
    })
    return
  }

  const filename = args[0]
  const file = uploadedFiles.find(f => f.name === filename)

  if (!file) {
    terminalHistory.push({
      type: 'error',
      content: `错误: 文件 ${filename} 不存在`
    })
    return
  }

  terminalHistory.push({
    type: 'success',
    content: `开始下载文件: ${filename}`
  })
}

const handleGitCommand = (args) => {
  if (args.length === 0) {
    terminalHistory.push({
      type: 'error',
      content: '错误: 请指定 Git 子命令'
    })
    return
  }

  const subcommand = args[0]

  switch (subcommand) {
    case 'status':
      terminalHistory.push({
        type: 'output',
        content: 'On branch main'
      })
      terminalHistory.push({
        type: 'output',
        content: 'Your branch is up to date with \'origin/main\'.'
      })
      terminalHistory.push({
        type: 'output',
        content: 'nothing to commit, working tree clean'
      })
      break
    case 'push':
      terminalHistory.push({
        type: 'output',
        content: 'Pushing to origin...'
      })
      setTimeout(() => {
        terminalHistory.push({
          type: 'success',
          content: 'Push successful!'
        })
        nextTick(() => {
          scrollToBottom()
        })
      }, 1500)
      break
    case 'pull':
      terminalHistory.push({
        type: 'output',
        content: 'Already up to date.'
      })
      break
    default:
      terminalHistory.push({
        type: 'error',
        content: `git: '${subcommand}' is not a git command.`
      })
  }
}

const navigateHistory = (direction) => {
  if (commandHistory.value.length === 0) return

  if (direction === 'up') {
    if (historyIndex.value > 0) {
      historyIndex.value--
      currentCommand.value = commandHistory.value[historyIndex.value]
    }
  } else if (direction === 'down') {
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++
      currentCommand.value = commandHistory.value[historyIndex.value]
    } else {
      historyIndex.value = commandHistory.value.length
      currentCommand.value = ''
    }
  }
}

const autoComplete = () => {
  const input = currentCommand.value.trim()
  if (!input) return

  const matches = availableCommands.filter(cmd => cmd.startsWith(input))
  if (matches.length === 1) {
    currentCommand.value = matches[0] + ' '
  } else if (matches.length > 1) {
    terminalHistory.push({
      type: 'output',
      content: `可能的命令: ${matches.join(', ')}`
    })
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const scrollToBottom = () => {
  if (terminalRef.value) {
    terminalRef.value.scrollTop = terminalRef.value.scrollHeight
  }
}

const startCursorBlink = () => {
  cursorTimer = setInterval(() => {
    cursorBlink.value = !cursorBlink.value
  }, 500)
}

const stopCursorBlink = () => {
  if (cursorTimer) {
    clearInterval(cursorTimer)
    cursorTimer = null
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
}

// 生命周期
onMounted(() => {
  startCursorBlink()
  document.addEventListener('keydown', handleKeydown)

  // 初始化终端焦点
  nextTick(() => {
    focusTerminal()
  })
})

onUnmounted(() => {
  stopCursorBlink()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-toolbar {
  margin-bottom: 20px;

  .page-title {
    h2 {
      margin: 0 0 8px 0;
      color: #303133;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }
}



.file-list-section {
  margin-bottom: 20px;
  flex: 1;
  min-height: 300px;

  .file-list-card {
    height: 100%;

    :deep(.el-card__body) {
      padding: 0;
      height: calc(100% - 60px);
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;

      .el-icon {
        margin-right: 8px;
        font-size: 18px;
        color: #409eff;
      }

      span {
        font-weight: 600;
        margin-right: 8px;
      }
    }
  }

  .file-list-content {
    height: 100%;
    overflow: auto;
  }

  .file-name {
    display: flex;
    align-items: center;

    .el-icon {
      margin-right: 8px;
      font-size: 16px;
    }
  }
}

.terminal-section {
  height: 400px;

  .terminal-card {
    height: 100%;

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      border-radius: 0;
    }

    :deep(.el-card__header) {
      padding: 12px 20px;
      background: #2c3e50;
      color: white;
      border-bottom: 1px solid #34495e;
    }

    :deep(.el-card__body) {
      padding: 0;
      height: calc(100% - 50px);
      background: #1e1e1e;
    }
  }

  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .terminal-title {
      display: flex;
      align-items: center;
      color: white;

      .el-icon {
        margin-right: 8px;
        font-size: 16px;
      }

      span {
        font-weight: 600;
      }
    }

    .terminal-controls {
      .el-button {
        color: white;

        &:hover {
          color: #409eff;
        }
      }
    }
  }

  .terminal-content {
    height: 100%;
    padding: 16px;
    background: #1e1e1e;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    overflow-y: auto;
    cursor: text;
  }

  .terminal-history {
    margin-bottom: 8px;
  }

  .terminal-line {
    margin-bottom: 4px;

    &.command {
      color: #ffffff;
    }

    &.output {
      color: #a0a0a0;
    }

    &.success {
      color: #67c23a;
    }

    &.error {
      color: #f56c6c;
    }

    &.info {
      color: #409eff;
    }
  }

  .terminal-prompt {
    color: #67c23a;
    font-weight: bold;
    margin-right: 8px;
  }

  .terminal-input-line {
    display: flex;
    align-items: center;
  }

  .terminal-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    margin-left: 8px;

    &::placeholder {
      color: #666;
    }
  }

  .terminal-cursor {
    color: #ffffff;
    font-weight: bold;
    margin-left: 2px;

    &.blink {
      animation: blink 1s infinite;
    }
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }

  .git-info-section {
    .info-card {
      height: auto;
      margin-bottom: 16px;
    }
  }

  .terminal-section {
    height: 300px;
  }

  .terminal-content {
    font-size: 12px;
    padding: 12px;
  }
}

// 暗色主题适配
html.dark {
  .top-toolbar {
    .page-title {
      h2 {
        color: var(--el-text-color-primary);
      }

      p {
        color: var(--el-text-color-regular);
      }
    }
  }



  .terminal-card {
    :deep(.el-card) {
      background: var(--el-bg-color-overlay);
      border: 1px solid var(--el-border-color);
    }
  }
}
</style>