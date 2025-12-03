<template>
  <div class="box bgc3 sku-sale-rank">
    <!-- TODO: 分辨大怎么展示问UI -->
    <div class="header">
      <div class="title">
        商品热榜<span class="sub-title">{{ start }} ~ {{ end }}</span>
      </div>
    </div>
    <div class="body" v-if="skuSaleRank.length" ref="rankContainerRef" :style="{ '--rank-gap': gapPx + 'px' }">
      <el-row
        v-for="(item, index) in skuSaleRank"
        :key="index"
        :gutter="15"
        :class="['rank-row', index===0 ? 'rank-1' : index===1 ? 'rank-2' : index===2 ? 'rank-3' : 'rank-other']"
        :style="{ height: (computedHeights[index] || 0) + 'px' }"
      >
        <el-col :span="5">
          <div :class="'top top' + (index + 1)">
            {{ index + 1 }}
          </div>
        </el-col>
        <el-col :span="13">
          <div class="sku-name" :title="item.skuName">
            {{ item.skuName }}
          </div>
        </el-col>
        <el-col :span="6">
          <div class="count">{{ item.count }}单</div>
        </el-col>
      </el-row>
    </div>
    <div v-else class="empty">
      <el-empty description="暂无数据" />
    </div>
  </div>
</template>
<script setup>
import { onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus'
import { getSkuSaleRank } from '@/api/home/homePage'
// 定义变量
const skuSaleRank = ref([])
const loading = ref(true)
const rankContainerRef = ref(null)
const gapPx = ref(20)
const computedHeights = ref([])
const calcHeights = () => {
  const n = (skuSaleRank.value || []).length
  const el = rankContainerRef.value
  if (!el || !n) { computedHeights.value = []; gapPx.value = 0; return }
  const h = el.clientHeight
  const gap = 20
  const totalGap = gap * (n - 1)
  const avail = Math.max(0, h - totalGap)
  const weights = (() => {
    if (n === 1) return [1]
    if (n === 2) return [1.2, 1]
    const arr = [1.794, 1.495, 1.3]
    for (let i = 3; i < n; i++) arr.push(1)
    return arr
  })()
  const sum = weights.reduce((a, b) => a + b, 0)
  const heights = weights.map(w => Math.floor(avail * w / sum))
  let used = heights.reduce((a, b) => a + b, 0)
  const rem = avail - used
  if (rem > 0 && heights.length) heights[0] += rem
  computedHeights.value = heights
  gapPx.value = gap
}
onMounted(async () => {
  try {
    const data = await getSkuSaleRank({
      start: dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
      end: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      limit: 10
    })
    skuSaleRank.value = Array.isArray(data) ? data : []
  } catch (e) {
    ElMessage.error('商品热榜数据加载失败')
  } finally {
    loading.value = false
    nextTick(calcHeights)
  }
})
watch(skuSaleRank, () => { nextTick(calcHeights) })
let ro
onMounted(() => {
  ro = new ResizeObserver(() => { calcHeights() })
  if (rankContainerRef.value) ro.observe(rankContainerRef.value)
})
onBeforeUnmount(() => { if (ro) ro.disconnect() })
const start = dayjs().startOf('month').format('YYYY.MM.DD');
const end = dayjs().endOf('day').format('YYYY.MM.DD');
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.module.scss';

.sku-sale-rank {
  display: flex;
  flex-direction: column;
  height: calc((100vh - 120px) * 0.6);
  min-height: 538px;
  background: #FFFFFF;
  border-radius: 20px;

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    margin-top: 20px;
    gap: var(--rank-gap);
    overflow: hidden;

    .rank-row {
      align-items: center;
    }

    .rank-1 .sku-name, .rank-1 .count { font-size: 24px; font-weight: 600; line-height: 1; }
    .rank-2 .sku-name, .rank-2 .count { font-size: 20px; font-weight: 600; line-height: 1; }
    .rank-3 .sku-name, .rank-3 .count { font-size: 18px; font-weight: 500; line-height: 1; }
    .rank-other .sku-name, .rank-other .count { font-size: 16px; font-weight: 400; line-height: 1; }

    .top {
      display: inline-block;
      width: 20px;
      height: 24px;
      margin-left: 10px;
      background: url('@/assets/user-task-stats/top.png');
      background-repeat: no-repeat;
      background-size: contain;
      text-align: center;
      font-size: 12px;
      font-weight: normal;
      color: #E9B499;
      line-height: 18px;
    }

    .top1 {
      width: 24px;
      height: 26px;
      background: url('@/assets/user-task-stats/top1.png');
      background-repeat: no-repeat;
      background-size: contain;
      color: #8E5900;
    }

    .top2 {
      width: 22px;
      height: 24px;
      background: url('@/assets/user-task-stats/top2.png');
      background-repeat: no-repeat;
      background-size: contain;
      color: #494949;
    }

    .top3 {
      width: 22px;
      height: 24px;
      background: url('@/assets/user-task-stats/top3.png');
      background-repeat: no-repeat;
      background-size: contain;
      color: #CF6D3D;
    }

    .sku-name {
      height: auto;
      color: $--color-text-primary;
      line-height: 1.2;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .count {
      height: auto;
      color: #737589;
      line-height: 1.2;
      text-align: right;
    }
  }
}
</style>
