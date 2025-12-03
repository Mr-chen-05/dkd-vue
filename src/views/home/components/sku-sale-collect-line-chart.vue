<template>
  <div class="chart">
    <div id="chart" class="monitorContainer" />
  </div>
  </template>
<script setup>
import * as echarts from 'echarts';
import { onMounted, watch, nextTick } from 'vue';
import dayjs from 'dayjs'
import EmptyDataChart from '@/components/empty-data-chart/index.vue';
const props = defineProps({
  chartOption: {
    type: Object,
    default: () => {},
  },
});
// 定义变量
// 坐标轴颜色
const axisStyleColor1 = ref('#D9D9D9');
const axisStyleColor2 = ref('#999999');
// 线的颜色
const lineStyleColor = ref('#FF5757');
// 渐变的颜色
const areaStyleColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: 'rgba(255, 87, 87, 0.5)' },
  { offset: 0.3, color: 'rgba(255, 169, 169, 0.3)' },
  { offset: 1, color: 'rgba(255, 169, 169, 0)' },
]);
onMounted(() => {
  nextTick(setOption);
});
let myChart = null;
const setOption = () => {
  const chartDom = document.getElementById('chart');
  if (!chartDom) return;
  if (myChart) {
    try { myChart.dispose() } catch (e) {}
  }
  myChart = echarts.init(chartDom);
  let option = null;
  const grid = {
    left: '30',
    right: '33',
    top: '60',
    bottom: '5',
    containLabel: true,
  };
  nextTick(() => {
    setTimeout(() => {
      const format = 'YYYY-MM-DD'
      const xAxis = (props.chartOption.xAxisData || []).length ? props.chartOption.xAxisData : Array.from({ length: 7 }).map((_, i) => dayjs().subtract(6 - i, 'day').format(format))
      const seriesByClass = (props.chartOption.seriesDataByClass || [])
      const baseSeries = [{ name: '暂无数据', data: xAxis.map(() => 0) }]
      // 动态计算 y 轴范围：根据数据最大值自适应，避免年视图下折线被压顶
      const collectAllValues = () => {
        if (seriesByClass.length) {
          return seriesByClass.flatMap(s => (s.data || []))
        }
        return (props.chartOption.seriesData || baseSeries[0].data)
      }
      const values = collectAllValues()
      const maxVal = Math.max(0, ...values)
      const dynMax = (() => {
        if (maxVal <= 15) return 15
        // 上浮 20%，并取整到 5 的倍数
        const up = Math.ceil(maxVal * 1.2)
        return up + (5 - (up % 5)) % 5
      })()
      const dynInterval = (() => {
        const seg = Math.max(1, Math.round(dynMax / 5))
        // 取整到 1 的倍数（显示更细腻）
        return seg
      })()
      option = {
        title: {
          text: '销售额趋势图',
          left: 'center',
          top: '10',
          textStyle: {
            color: '#333333',
            fontWeight: 'bolder',
            fontSize: 14,
          },
        },
        grid: grid,
        xAxis: {
          type: 'category',
          data: xAxis,
          axisLine: {
            lineStyle: {
              color: axisStyleColor1.value,
            },
          },
          axisTick: {
            show: true,
            lineStyle: {
              color: axisStyleColor1.value,
            },
          },
          axisLabel: {
            align: 'center',
            color: axisStyleColor2.value,
          },
          boundaryGap: false,
        },
        yAxis: {
          type: 'value',
          name: props.chartOption.yAxisName,
          nameTextStyle: {
            color: axisStyleColor2.value,
          },
          min: 0,
          max: dynMax,
          interval: dynInterval,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: axisStyleColor2.value,
          },
          splitLine: {
            lineStyle: {
              color: axisStyleColor1.value,
            },
          },
        },
        legend: { top: 30 },
        series: (seriesByClass.length ? seriesByClass.map(s => ({ type: 'line', name: s.name, data: s.data, smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 2 } })) : [{ type: 'line', data: (props.chartOption.seriesData || []).length ? props.chartOption.seriesData : baseSeries[0].data, smooth: true, lineStyle: { color: lineStyleColor.value, width: 3, shadowColor: 'rgba(222, 115, 127, 0.23)', shadowBlur: 10, shadowOffsetY: 8 }, areaStyle: { color: areaStyleColor.value } }]),
        // TODO：细节调整
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            lineStyle: {
              color: axisStyleColor1.value,
              width: 2,
            },
          },
          formatter: '销售额：{c}<br />{b}',
          backgroundColor: '#FFFFFF',
          borderColor: '#eef3f8',
          borderWidth: 1,
          textStyle: {
            color: '#8C8C8C',
          },
          padding: 12,
        },
      };
      myChart.setOption(option);
    }, 10);
  });
};
watch(() => [props.chartOption.xAxisData, props.chartOption.seriesData, props.chartOption.seriesDataByClass], () => { nextTick(setOption) })
</script>
<style lang="scss" scoped>
.chart {
  position: relative;
  display: inline-block;
  width: 50%;
  height: 100%;
}
.monitorContainer {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
.show { visibility: visible; }
.hidden { visibility: hidden; }
</style>