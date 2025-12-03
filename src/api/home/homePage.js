import request from '@/utils/request'
// 统一以 /manage/statistics 开头的查询接口

// 查询工单统计（维修/运营），返回两组统计数据
export function getUserTaskStats(params) {
  return request({
    url: '/manage/statistics/userTaskStats',
    method: 'get',
    params
  }).then(res => res?.data || [])
}

// 查询销售统计（订单量、销售额）
export function getSalesStats(params) {
  return request({
    url: '/manage/statistics/salesStats',
    method: 'get',
    params
  }).then(res => res?.data || { orderCount: 0, orderAmount: 0 })
}

// 查询商品热榜（TopN）
export function getSkuSaleRank(params) {
  return request({
    url: '/manage/statistics/skuSaleRank',
    method: 'get',
    params
  }).then(res => res?.data || [])
}

// 查询销售趋势（按日或按月）
export function getSalesTrend(params) {
  return request({
    url: '/manage/statistics/salesTrend',
    method: 'get',
    params
  }).then(res => res?.data || { xAxisData: [], seriesData: [], yAxisName: '单位：元' })
}

export function getSalesTrendByClass(params) {
  return request({
    url: '/manage/statistics/salesTrendByClass',
    method: 'get',
    params
  }).then(res => res?.data || { xAxisData: [], seriesDataByClass: [], yAxisName: '单位：元' })
}

// 查询销售区域分布（TopN）
export function getSalesRegionDistribution(params) {
  return request({
    url: '/manage/statistics/salesRegionDistribution',
    method: 'get',
    params
  }).then(res => res?.data || { xAxisData: [], seriesData: [], yAxisName: '单位：元' })
}

// 查询合作商点位TopN及汇总
export function getPartnerNodeTop(params) {
  return request({
    url: '/manage/statistics/partnerNodeTop',
    method: 'get',
    params
  }).then(res => res?.data || { seriesData: [], totalNodes: 0, partnerCount: 0 })
}

// 查询异常设备列表（非运营状态）
export function getAbnormalEquipmentList(params) {
  return request({
    url: '/manage/statistics/abnormalEquipmentList',
    method: 'get',
    params
  }).then(res => res?.data || [])
}