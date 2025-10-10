import { ElNotification, ElMessage } from 'element-plus'

/**
 * 格式化错误消息，支持换行显示
 * @param {string} message - 原始错误消息
 * @returns {string} - 格式化后的HTML消息
 */
export function formatErrorMessage(message) {
  if (!message) return ''

  const normalized = String(message)
    .replace(/\r\n/g, '\n')
    .replace(/；|;/g, '\n')
    .replace(/。(?=[^$])/g, '。\n')
    .replace(/，(?=\s*[→\-\d])/g, '，\n')

  return normalized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `<div style="margin-bottom: 6px; color: #c45656; line-height: 1.6;">· ${line}</div>`)
    .join('')
}

/**
 * 显示支持换行的错误通知
 * @param {Object|string} options - 配置选项或错误消息字符串
 * @param {string} options.message - 错误消息
 * @param {string} options.title - 通知标题，默认为"操作失败"
 * @param {number} options.duration - 显示时长，默认为7000毫秒
 * @param {Object} options.customStyle - 自定义样式
 */
export function showErrorNotification(options = {}) {
  // 如果传入的是字符串，转换为对象格式
  if (typeof options === 'string') {
    options = { message: options }
  }
  
  const {
    message = '',
    title = '操作失败',
    duration = 7000,
    customStyle = {},
    footer = null
  } = options

  const formattedMessage = formatErrorMessage(message)
  const footerContent =
    typeof footer === 'string'
      ? `<div style="margin-top: 12px; font-size: 12px; color: #909399;">${footer}</div>`
      : ''
  
  ElNotification.error({
    title,
    message: `<div style="line-height: 1.6;">${formattedMessage || '暂无详细信息'}${footerContent}</div>`,
    duration,
    dangerouslyUseHTMLString: true,
    customClass: 'custom-error-notification',
    ...customStyle
  })
}

/**
 * 显示删除错误通知（专门用于删除操作）
 * @param {string} message - 错误消息
 * @param {Object} customOptions - 自定义配置
 */
export function showDeleteErrorNotification(message, customOptions = {}) {
  showErrorNotification({
    message,
    title: '删除失败',
    duration: 7000,
    footer: customOptions?.footer || '请检查引用关系并重试，如需帮助请联系系统管理员。',
    customStyle: {
      customClass: 'delete-error-notification'
    },
    ...customOptions
  })
}

/**
 * 处理API错误响应
 * @param {Object} error - 错误对象
 * @param {Function} customHandler - 自定义处理函数
 */
export function handleApiError(error, customHandler = null) {
  if (customHandler && typeof customHandler === 'function') {
    return customHandler(error)
  }
  
  // 默认处理
  const message = error.msg || error.message || '操作失败'
  showErrorNotification({ message })
}