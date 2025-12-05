<template>
  <div class="box sku-sale-collect">
    <div class="header">
      <div class="title">
        销售数据<span class="sub-title"
          >{{ datePickerFormat[0] }} ~ {{ datePickerFormat[1] }}</span
        >
      </div>
      <common-week-month-year @handleChange="handleRadioGroupSelChange" />
    </div>
    <div class="charts">
      <sku-sale-collect-line-chart
        id="amount-collect"
        title="销售额趋势图"
        :chart-option="lineChartOption"
      />
      <sku-sale-collect-bar-chart
        id="region-collect"
        title="销售额分布"
        :chart-option="barChartOption"
      />
    </div>
  </div>
</template>
<script setup>
import * as echarts from 'echarts';
import { onMounted } from 'vue';
import dayjs from 'dayjs';
import CommonWeekMonthYear from '@/components/week-month-year/index.vue';
import SkuSaleCollectLineChart from './sku-sale-collect-line-chart.vue';
import SkuSaleCollectBarChart from './sku-sale-collect-bar-chart.vue';
import { ElMessage } from 'element-plus'
import { getSalesTrend, getSalesRegionDistribution, getSalesTrendByClass } from '@/api/home/homePage'
import { listskuType } from '@/api/manage/skuType'
import { loadAllParam } from '@/api/page'
// 定义变量
const datePickerSel = ref([]);
const datePickerFormat = ref([]);
const radioGroupSel = ref('week');
const userTaskStatus = ref([]);
const lineChartOption = ref({ xAxisData: [], seriesData: [], yAxisName: '单位：元' });
const collectType = ref(1); // 统计时间类型，1:按日统计，2:按月统计
const barChartOption = ref({ xAxisData: [], seriesData: [], yAxisName: '单位：元' });
const classNameMap = ref({});
onMounted(()=>{
    handleRadioGroupSelChange(radioGroupSel.value)
    fetchCharts()
})
//
// 修正时间窗：end 使用所选粒度的末尾（年/月/周末），避免年视图仍以当天为结束
const handleRadioGroupSelChange = (radioGroup) => {
  radioGroupSel.value = radioGroup;
  const startFormat = dayjs()
    .startOf(radioGroupSel.value)
    .format('YYYY.MM.DD');
  const endFormat = dayjs()
    .endOf(radioGroupSel.value)
    .format('YYYY.MM.DD');
  datePickerFormat.value = [startFormat, endFormat];
  fetchCharts();
};
const fetchCharts = async () => {
  const granularity = radioGroupSel.value === 'year' ? 'month' : 'day'
  const start = dayjs().startOf(radioGroupSel.value).format('YYYY-MM-DD HH:mm:ss')
  // 修正结束时间与选择一致（年→年末、月→月末、周→周末），确保月/年视图数据差异明显
  const end = dayjs().endOf(radioGroupSel.value).format('YYYY-MM-DD HH:mm:ss')
  try {
    // 获取分类名称映射
    try {
      const res = await listskuType(loadAllParam)
      const map = {}
      ;(res?.rows || []).forEach(item => { map[item.classId] = item.className })
      classNameMap.value = map
    } catch (e) {
      classNameMap.value = classNameMap.value || {}
    }
    const trend = await getSalesTrendByClass({ start, end, granularity })
    const mappedSeries = (trend?.seriesDataByClass || []).map(s => ({
      ...s,
      name: classNameMap.value?.[Number(s?.name)] ?? String(s?.name)
    }))
    lineChartOption.value = { xAxisData: trend?.xAxisData || [], seriesDataByClass: mappedSeries, yAxisName: '单位：元' }
  } catch (e) {
    ElMessage.error('销售趋势数据加载失败')
    lineChartOption.value = { xAxisData: [], seriesDataByClass: [], yAxisName: '单位：元' }
  }
  try {
    const region = await getSalesRegionDistribution({ start, end, topN: 10, granularity: 'none' })
    barChartOption.value = region || { xAxisData: [], seriesData: [], yAxisName: '单位：元' }
  } catch (e) {
    ElMessage.error('销售区域数据加载失败')
    barChartOption.value = { xAxisData: [], seriesData: [], yAxisName: '单位：元' }
  }
}
</script>
<style lang="scss" scoped>
.sku-sale-collect {
  display: flex;
  flex-direction: column;
  // TODO: 临时解决方案，当前页面的横纵布局需要重新思考
  height: auto;
  min-height: 300px;
  margin-top: 20px;
  background: #FFFFFF;
  border-radius: 20px;
  padding-bottom: 12px;

  .charts {
    flex: 1;
    display: flex;
  }
}
</style>
