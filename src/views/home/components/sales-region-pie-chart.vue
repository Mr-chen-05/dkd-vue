<template>
  <div class="chart">
    <div id="regionPie" class="monitorContainer" />
  </div>
</template>
<script setup>
import * as echarts from 'echarts';
import { onMounted, watch, nextTick } from 'vue';
import EmptyDataChart from '@/components/empty-data-chart/index.vue';
const props = defineProps({
  chartOption: { type: Object, default: () => ({}) }
})
let myChart = null
const setOption = () => {
  const chartDom = document.getElementById('regionPie')
  if (!chartDom) return
  if (myChart) { try { myChart.dispose() } catch (e) {} }
  myChart = echarts.init(chartDom)
  nextTick(() => {
    setTimeout(() => {
      const data = (props.chartOption.seriesDataPie || []).length ? props.chartOption.seriesDataPie : [{ name: '暂无数据', value: 1 }]
      const option = {
        title: { text: '销售额分布', left: 'center', top: 10, textStyle: { color: '#333333', fontWeight: 'bolder', fontSize: 14 } },
        tooltip: { trigger: 'item', formatter: '{b}<br />总占比：{d}%', backgroundColor: '#FFFFFF', borderColor: '#eef3f8', borderWidth: 1, textStyle: { color: '#8C8C8C' }, padding: 12 },
        legend: { bottom: 0 },
        series: [ { type: 'pie', radius: ['50%', '70%'], center: ['50%', '50%'], data, avoidLabelOverlap: true, label: { formatter: '{b}\n{d}%', color: '#333333' }, labelLine: { lineStyle: { color: '#BFBFBF' } } } ],
        color: ['#85A7FF', '#99EBBD', '#FFB18B', '#C6EBFF', '#BECCE6', '#B2A3FF', '#FFC0CB']
      }
      myChart.setOption(option)
    }, 10)
  })
}
onMounted(() => { if ((props.chartOption.seriesDataPie || []).length) { nextTick(setOption) } })
watch(() => (props.chartOption.seriesDataPie || []).length, (len) => { if (len) { nextTick(setOption) } })
</script>
<style lang="scss" scoped>
.chart { position: relative; display: inline-block; width: 50%; height: 100%; }
.monitorContainer { width: 100%; height: 100%; min-height: 300px; }
</style>