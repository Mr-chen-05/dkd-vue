<template>
  <!-- 欢迎标语组件：头部淡入显示，包含主标题/副标题/正文与交互提示 -->
  <div class="welcome-banner" role="region" aria-label="欢迎标语">
    <div class="banner-grid">
      <div class="banner-main">
        <div class="one-line">
          <div class="welcome-split">
            <span class="split-cn">
              欢迎来到 <span class="brand-cn">赋优</span> （<span class="en brand-en">For You</span>）管理系统 —— 愿生活赋予你优秀的品质，也愿我们始终
            </span>
            <span class="split-en"><span class="en brand-en">For You</span></span>
          </div>
        </div>
      </div>
      <div class="banner-aside" aria-hidden="true">
        <div class="badge">
          <span class="badge-cn">赋优</span>
          <span class="badge-en">For You</span>
        </div>
      </div>
    </div>
    <!-- 动效覆盖层：SVG 星星与流星（不影响交互） -->
    <div class="fx-layer" aria-hidden="true">
      <svg class="fx-svg" ref="fxSvg" preserveAspectRatio="none"></svg>
    </div>
  </div>
</template>

<script setup lang="ts">
// 接收后端传入的用户名（来自 Pinia user store）
const props = defineProps({ username: { type: String, default: '' } })

import { ref, onMounted, onBeforeUnmount } from 'vue'

// SVG 容器引用
const fxSvg = ref<SVGSVGElement | null>(null)

// 动效状态
let rafId = 0
let hoverBoost = 1
let reducedMotion = false
let hoverTarget = 1
let lastTs = 0

// 尺寸与元素状态
let width = 0
let height = 0
let resizeObserver: ResizeObserver | null = null

// 星星与流星数据结构
type Star = {
  el: SVGPathElement
  x: number
  y: number
  r: number
  baseOpacity: number
  phase: number
  freq: number
  nudgeX: number
  nudgeY: number
  currentOpacity: number
  currentScale: number
}
type Meteor = {
  el: SVGGElement
  startX: number
  startY: number
  endX: number
  endY: number
  startTs: number
  duration: number
}

let stars: Star[] = []
let meteors: Meteor[] = []
let meteorTimer: number | null = null

// 五角星路径生成（中心 x,y，半径 r）
function starPath(x: number, y: number, r: number): string {
  const points: Array<[number, number]> = []
  const outer = r
  const inner = r * 0.5
  const angle = Math.PI / 2
  for (let i = 0; i < 5; i++) {
    const aOuter = angle + (i * 2 * Math.PI) / 5
    const aInner = angle + ((i * 2 + 1) * Math.PI) / 5
    points.push([x + Math.cos(aOuter) * outer, y - Math.sin(aOuter) * outer])
    points.push([x + Math.cos(aInner) * inner, y - Math.sin(aInner) * inner])
  }
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
    .join(' ') + ' Z'
}

function clearSvg() {
  const svg = fxSvg.value
  if (!svg) return
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}

function setupDefs(svg: SVGSVGElement) {
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  // 流星尾迹渐变
  const lg = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
  lg.setAttribute('id', 'meteorGradient')
  lg.setAttribute('x1', '0%'); lg.setAttribute('y1', '0%')
  lg.setAttribute('x2', '100%'); lg.setAttribute('y2', '0%')
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
  stop1.setAttribute('offset', '0%')
  stop1.setAttribute('stop-color', '#FFFACD')
  stop1.setAttribute('stop-opacity', '0.8')
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
  stop2.setAttribute('offset', '100%')
  stop2.setAttribute('stop-color', '#FFD700')
  stop2.setAttribute('stop-opacity', '0')
  lg.appendChild(stop1); lg.appendChild(stop2)

  defs.appendChild(lg)
  svg.appendChild(defs)
}

function uniformPositions(count: number): Array<{ x: number; y: number }> {
  const arr: Array<{ x: number; y: number }> = []
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  for (let i = 0; i < count; i++) {
    const c = i % cols
    const r = (i / cols) | 0
    const jitterX = (Math.random() - 0.5) * (width / cols) * 0.6
    const jitterY = (Math.random() - 0.5) * (height / rows) * 0.6
    const x = ((c + 0.5) / cols) * width + jitterX
    const y = ((r + 0.5) / rows) * height + jitterY
    arr.push({ x, y })
  }
  return arr
}

function computeStarCount(): number {
  const area = width * height
  if (area >= 900_000) return 70
  if (area >= 500_000) return 55
  if (area >= 250_000) return 40
  return 24
}

function createStars() {
  const svg = fxSvg.value
  if (!svg) return
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  layer.setAttribute('class', 'stars-layer')
  const count = computeStarCount()
  const positions = uniformPositions(count)
  stars = []
  for (let i = 0; i < count; i++) {
    const p = positions[i]
    const r = 3 + Math.random() * 5
    const baseOpacity = 0.3 + Math.random() * 0.7
    const phase = Math.random() * Math.PI * 2
    const freq = 0.6 + Math.random() * 0.8
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', starPath(p.x, p.y, r))
    path.setAttribute('fill', '#FFD700')
    path.setAttribute('stroke', '#FFFACD')
    path.setAttribute('stroke-width', '0.4')
    path.setAttribute('opacity', baseOpacity.toFixed(2))
    path.style.willChange = 'opacity, transform'
    layer.appendChild(path)
    stars.push({ el: path, x: p.x, y: p.y, r, baseOpacity, phase, freq, nudgeX: 0, nudgeY: 0, currentOpacity: baseOpacity, currentScale: 1 })
  }
  svg.appendChild(layer)
}

function spawnMeteor() {
  if (!fxSvg.value) return
  const svg = fxSvg.value
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.setAttribute('class', 'meteor')
  const trail = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  const length = 140 + Math.random() * 80
  const thickness = 2 + Math.random() * 1.5
  trail.setAttribute('width', String(length))
  trail.setAttribute('height', String(thickness))
  trail.setAttribute('fill', 'url(#meteorGradient)')
  const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  head.setAttribute('r', '2.2')
  head.setAttribute('fill', '#FFFACD')
  head.setAttribute('stroke', '#FFD700')
  head.setAttribute('stroke-width', '0.6')
  g.appendChild(trail)
  g.appendChild(head)
  svg.appendChild(g)

  // 起止点（斜向）
  const startX = width * (0.2 + Math.random() * 0.6)
  const startY = -20
  const endX = startX - (100 + Math.random() * 200)
  const endY = height + 40
  const duration = 1200 + Math.random() * 600
  const m: Meteor = { el: g, startX, startY, endX, endY, startTs: performance.now(), duration }
  meteors.push(m)
}

function applyNearbyNudge(mx: number, my: number) {
  const radius = 120
  for (const s of stars) {
    const dx = s.x - mx
    const dy = s.y - my
    const d2 = dx * dx + dy * dy
    if (d2 < radius * radius) {
      const dist = Math.sqrt(d2)
      const epsilon = 0.001
      if (dist < epsilon) continue
      const strength = Math.max(0, Math.min(2.5, (1 - dist / radius) * 2.5))
      const angle = Math.atan2(dy, dx)
      const targetX = Math.cos(angle) * strength
      const targetY = Math.sin(angle) * strength
      s.nudgeX = s.nudgeX + (targetX - s.nudgeX) * 0.35
      s.nudgeY = s.nudgeY + (targetY - s.nudgeY) * 0.35
    }
  }
}

function animate(ts: number) {
  if (reducedMotion) {
    // 禁用动效时不执行动画循环
    return
  }
  // 悬停频率缓动到目标值
  hoverBoost = hoverBoost + (hoverTarget - hoverBoost) * 0.12

  // 帧间时间步长（秒），限制上限避免大跳变
  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0

  // 星星闪烁与轻微缩放
  for (const s of stars) {
    // 相位推进（不直接改频率），悬停影响振幅
    s.phase += s.freq * dt
    const raw = Math.abs(Math.sin(s.phase))
    const ease = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2
    const ampFactor = 1 + (hoverBoost - 1) * 0.5
    const twinkle = (0.35 + 0.65 * ease(raw)) * ampFactor
    const targetOpacity = Math.max(0.2, Math.min(1, s.baseOpacity * twinkle))
    const targetScale = 0.96 + 0.08 * twinkle
    // JS 平滑（lerp/damper）
    s.currentOpacity = s.currentOpacity + (targetOpacity - s.currentOpacity) * 0.18
    s.currentScale = s.currentScale + (targetScale - s.currentScale) * 0.18
    s.el.style.opacity = s.currentOpacity.toFixed(2)
    const tx = (s.nudgeX *= 0.92)
    const ty = (s.nudgeY *= 0.92)
    s.el.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s.currentScale.toFixed(3)})`
  }

  // 流星动画与清理
  if (meteors.length) {
    const rest: Meteor[] = []
    for (const m of meteors) {
      const elapsed = ts - m.startTs
      const p = Math.min(1, elapsed / m.duration)
      const x = m.startX + (m.endX - m.startX) * p
      const y = m.startY + (m.endY - m.startY) * p
      const angle = -40
      m.el.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${angle})`)
      // 流星头定位到轨迹起点附近
      const head = m.el.querySelector('circle') as SVGCircleElement | null
      const trail = m.el.querySelector('rect') as SVGRectElement | null
      if (trail) trail.setAttribute('x', '-4')
      if (trail) trail.setAttribute('y', '-1')
      if (head) head.setAttribute('cx', '0')
      if (head) head.setAttribute('cy', '0')

      // 途经扰动星星
      applyNearbyNudge(x, y)

      if (p < 1) rest.push(m)
      else m.el.remove()
    }
    meteors = rest
  }

  lastTs = ts
  rafId = requestAnimationFrame(animate)
}

function scheduleMeteor() {
  if (meteorTimer) clearTimeout(meteorTimer)
  const interval = 5000 + Math.random() * 3000
  meteorTimer = window.setTimeout(() => {
    if (!reducedMotion) spawnMeteor()
    scheduleMeteor()
  }, interval)
}

function measureAndBuild() {
  const svg = fxSvg.value
  if (!svg) return
  width = svg.clientWidth
  height = svg.clientHeight
  clearSvg()
  setupDefs(svg)
  createStars()
}

function setupReducedMotion() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const update = () => {
    reducedMotion = mq.matches
    if (reducedMotion) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
    } else {
      if (!rafId) { rafId = requestAnimationFrame(animate) }
    }
  }
  update()
  mq.addEventListener?.('change', update)
}

onMounted(() => {
  setupReducedMotion()
  measureAndBuild()
  if (!reducedMotion) rafId = requestAnimationFrame(animate)
  scheduleMeteor()

  // 悬停加速
  const root = fxSvg.value?.parentElement?.parentElement
  root?.addEventListener('mouseenter', () => { hoverTarget = 1.6 })
  root?.addEventListener('mouseleave', () => { hoverTarget = 1 })

  // 尺寸变化
  if (fxSvg.value) {
    resizeObserver = new ResizeObserver(() => {
      measureAndBuild()
    })
    resizeObserver.observe(fxSvg.value)
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (meteorTimer) clearTimeout(meteorTimer)
  if (resizeObserver && fxSvg.value) resizeObserver.unobserve(fxSvg.value)
  stars = []
  meteors = []
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.module.scss';

.welcome-banner {
  /* 容器：渐变背景 + 阴影 + 动画 */
  padding: 28px 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(233,243,255,0.7) 0%, rgba(255,255,255,0.95) 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: fade-in 0.6s ease-out both;
  line-height: 1.7;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  border: 1px solid rgba(64,158,255,0.1);
  position: relative;

  /* 字体：中文与英文分设栈 */
  font-family: 'Source Han Sans SC', '思源黑体', system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, 'Noto Sans', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;

  .banner-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; align-items: center; position: relative; z-index: 1; }
  .banner-main { display: flex; flex-direction: column; }
  .one-line { 
    font-size: 17px; 
    color: #3a3a3a; 
    line-height: 1.7;
    font-weight: 500;
    letter-spacing: 0.2px;
  }
  .welcome-split {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(4px);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: baseline;
    justify-content: flex-start;
    gap: 8px;
    flex-wrap: wrap;
    position: relative;
  }
  .welcome-split::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 8px;
    height: 1px;
    background: linear-gradient(90deg, #e6b800 0%, rgba(230,184,0,0) 100%);
    opacity: 0.6;
  }
  .split-cn { color: #1a3a6c; font-weight: 700; }
  .split-cn .brand-cn { color: #1a3a6c; }
  .split-en { color: #e6b800; font-weight: 700; position: relative; display: inline-block; margin-left: 8px; }
  .split-en::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle, #FFD700 0%, rgba(255,215,0,0) 70%);
    transform-origin: -18px -6px;
    animation: spin 8s linear infinite;
    opacity: 0.8;
  }
  @keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  .welcome-split:hover .split-en { transform: translateY(-2px); text-shadow: 0 2px 8px rgba(230,184,0,0.28); transition: 220ms ease; }

  /* 响应式收紧 */
  @media (max-width: 768px) {
    .welcome-split { gap: 6px; }
    .split-en { margin-left: 6px; }
  }
  .brand-cn {
    color: var(--el-color-primary);
    font-weight: 700;
    font-size: 18px;
    position: relative;
    padding: 0 4px;
    transition: all 0.3s ease;
  }
  .brand-cn:hover {
    color: #409eff;
    text-shadow: 0 0 8px rgba(64,158,255,0.3);
  }
  .en {
    font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
  }
  .brand-en {
    color: var(--el-color-primary);
    font-weight: 700;
    font-size: 18px;
    position: relative;
    padding: 0 2px;
    transition: all 0.3s ease;
  }
  .brand-en:hover {
    color: #409eff;
    text-shadow: 0 0 8px rgba(64,158,255,0.3);
  }


  .banner-aside {
    min-height: 100px;
    border-radius: 16px;
    background: radial-gradient(circle at center, rgba(230,247,255,0.85) 0%, rgba(230,247,255,0.35) 35%, rgba(230,247,255,0.0) 70%);
    box-shadow: 0 8px 20px rgba(64,158,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    border: none;
    transition: box-shadow 300ms ease, transform 300ms ease;
  }
  .banner-aside::after {
    content: '';
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%);
    right: -20px;
    top: -20px;
  }
  .banner-aside::before {
    content: '';
    position: absolute;
    top: -24px;
    left: -24px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,250,205,0.45) 0%, rgba(255,250,205,0.0) 70%);
    pointer-events: none;
  }
  .badge { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .badge-cn { font-weight: 700; color: #1a3a6c; font-size: 22px; text-shadow: 0 1px 2px rgba(0,0,0,0.08); }
  .badge-en { font-family: 'Dancing Script','cursive','Inter','Helvetica','Arial',sans-serif; font-weight: 700; color: #e6b800; font-size: 18px; opacity: 0.95; letter-spacing: 0.4px; position: relative; transition: transform 300ms ease, text-shadow 300ms ease; }
  .badge-en::after { content: '❤'; margin-left: 6px; font-size: 12px; color: #e6b800; opacity: 0.65; vertical-align: baseline; }
}

/* 覆盖动效图层 */
.fx-layer { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.fx-svg { width: 100%; height: 100%; display: block; }
.stars-layer path { will-change: opacity, transform; transform-box: fill-box; transform-origin: center; }
.meteor { will-change: transform; }

/* 微交互与一致性增强 */
.brand-cn,
.brand-en { transition: color 220ms ease, text-shadow 220ms ease, transform 220ms cubic-bezier(.2,.7,.3,1); }
.welcome-banner:hover .brand-cn,
.welcome-banner:hover .brand-en { transform: translateY(-1px); }

.banner-aside { transition: transform 220ms cubic-bezier(.2,.7,.3,1), box-shadow 220ms ease; }
.welcome-banner:hover .banner-aside { transform: scale(1.02); box-shadow: 0 10px 26px rgba(64,158,255,0.24); }
.badge { transition: transform 200ms cubic-bezier(.2,.7,.3,1), filter 200ms ease; }
.welcome-banner:hover .badge { transform: translateY(-2px); filter: drop-shadow(0 2px 6px rgba(255,215,0,0.25)); }
.welcome-banner:hover .badge-en { transform: translateY(-3px); text-shadow: 0 2px 10px rgba(230,184,0,0.30); }

@keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

/* 响应式：移动端降低字号与内边距 */
@media (max-width: 768px) {
  .welcome-banner { 
    padding: 24px; 
    border-radius: 16px;
    margin-bottom: 16px;
  }
  .welcome-banner .one-line { 
    font-size: 15px; 
    line-height: 1.65;
  }
  .welcome-banner .banner-grid { grid-template-columns: 1fr; gap: 12px; }
  .welcome-banner .banner-aside { 
    min-height: 80px; 
    border-radius: 12px;
  }
  .welcome-banner .brand-cn,
  .welcome-banner .brand-en { font-size: 16px; }
  .welcome-banner .badge-cn { font-size: 18px; }
  .welcome-banner .badge-en { font-size: 14px; }
}

/* 夜间模式适配 */
@media (prefers-color-scheme: dark) {
  .welcome-banner {
    background: linear-gradient(135deg, rgba(30,40,60,0.7) 0%, rgba(20,25,35,0.95) 100%);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2);
    border: 1px solid rgba(64,158,255,0.15);
  }
  .welcome-banner .one-line { color: #e0e0e0; }
  .welcome-banner .banner-aside { 
    background: linear-gradient(135deg, rgba(64,158,255,0.2) 0%, rgba(64,158,255,0.3) 100%);
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    border: 1px solid rgba(64,158,255,0.25);
  }
  .brand-cn:hover,
  .brand-en:hover {
    color: #66b1ff;
    text-shadow: 0 0 10px rgba(102,177,255,0.4);
  }
}
</style>
  /* 极简分隔点（若与旋转微粒冲突，可改用发光细线） */
  .split-en::before { content: '·'; position: absolute; left: -10px; color: #e6b800; opacity: 0.6; font-weight: 700; }