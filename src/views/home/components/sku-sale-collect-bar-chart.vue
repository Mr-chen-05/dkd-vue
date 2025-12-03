<template>
<div class="chart">
  <div id="chartId" ref="EcharRef" class="monitorContainer"></div>
</div>

</template>
<script setup>
import * as echarts from 'echarts';
import { onMounted, watch, nextTick } from 'vue';
const props = defineProps({
  chartOption: {
    type: Object,
    default: () => {},
  },
});
// 坐标轴的颜色
const axisColor = ref('#D9D9D9');
const axisColor2 = ref('#999999');
// 柱条的颜色
const itemStyleColor = ref('#91B0FF');
onMounted(() => {
  setOption();
});
let myChart = null
const setOption = () => {
  const chartDom = document.getElementById('chartId')
  if (!chartDom) return
  if (myChart) {
    try { myChart.dispose() } catch (e) {}
  }
  myChart = echarts.init(chartDom)
  let option = null
  const grid = {
    left: '33',
    right: '30',
    top: '60',
    bottom: '5',
    containLabel: true,
  };
  nextTick(() => {
    setTimeout(() => {
      const x = (props.chartOption.xAxisData || []).length ? props.chartOption.xAxisData : ['暂无数据']
      const y = (props.chartOption.seriesData || []).length ? props.chartOption.seriesData : [0]
      option = {
        title: {
          text: '销售额分布',
          left: 'center',
          top: '10',
          textStyle: {
            color: '#333333',
            fontWeight: 'bolder',
            fontSize: 14,
          },
        },
        grid: grid,
        legend: {
          bottom: 0,
          data: [],
        },
        xAxis: {
          type: 'category',
          data: x,
          axisLine: {
            lineStyle: {
              color: axisColor.value,
            },
          },
          axisTick: {
            show: true,
            lineStyle: {
              color: axisColor.value,
            },
          },
          axisLabel: {
            interval: 0,
            align: 'center',
            color: axisColor2.value,
            hideOverlap: true,
            // 自适应：月份不截断，地址适度换行显示
            formatter: function (value) {
              const isMonth = /^\d{4}-\d{2}$/.test(value)
              if (isMonth) return value
              if (typeof value === 'string') {
                const idx = value.indexOf('-')
                if (idx > -1) {
                  return value.slice(0, idx).trim()
                }
              }
              return value
            },
            // 若是月份视图，轻微旋转提升可读性
            rotate: (x && x.length && /^\d{4}-\d{2}$/.test(x[0])) ? 30 : 0,
          },
        },
        yAxis: {
          type: 'value',
          name: props.chartOption.yAxisName,
          nameTextStyle: {
            color: axisColor2.value,
          },
          min: 0,
          max: 1000,
          interval: 200,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: axisColor2.value,
          },
          splitLine: {
            lineStyle: {
              color: axisColor.value,
            },
          },
        },
        series: [
          {
            type: 'bar',
            data: y,
            itemStyle: {
              color: itemStyleColor.value,
              barBorderRadius: [4, 4, 0, 0],
            },
            barWidth: 14,
            barGap: '100%',
            emphasis: { focus: 'series' },
          },
        ],
        // TODO：细节调整
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove|click',
          transitionDuration: 0.2,
          enterable: true,
          confine: true,
          formatter: function (params) {
            const fullName = params.name
            const val = Array.isArray(params.value) ? params.value[1] : params.value
            return `<div class="chart-tip"><div>地区：${fullName}</div><div>销售额：${val}</div></div>`
          },
          backgroundColor: '#FFFFFF',
          borderColor: '#eef3f8',
          borderWidth: 1,
          textStyle: { color: '#8C8C8C' },
          padding: 12,
          extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.08);border-radius:8px;',
          showDelay: 50,
          hideDelay: 100,
        },
        axisPointer: { type: 'shadow', shadowStyle: { opacity: 0.08 } },
        animationDurationUpdate: 200,
      };
      myChart.setOption(option)
    }, 10);
  });
};
onMounted(() => {
  nextTick(setOption)
})
watch(
  () => [props.chartOption.xAxisData, props.chartOption.seriesData, props.chartOption.yAxisName],
  () => {
    nextTick(setOption)
  }
)
const getSeriesOption = () => []
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

  & > div {
    &:first-child {
      width: 100% !important;

      & > canvas {
        width: 100% !important;
      }
    }
  }
}
.show {
  visibility: visible;
}

.hidden {
  visibility: hidden;
}
</style>
