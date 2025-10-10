import request from '@/utils/request'

// 查询商品管理列表
export function listsku(query) {
  return request({
    url: '/manage/sku/list',
    method: 'get',
    params: query
  })
}

// 查询商品管理详细
export function getsku(skuId) {
  return request({
    url: '/manage/sku/' + skuId,
    method: 'get'
  })
}

// 新增商品管理
export function addsku(data) {
  return request({
    url: '/manage/sku',
    method: 'post',
    data: data
  })
}

// 修改商品管理
export function updatesku(data) {
  return request({
    url: '/manage/sku',
    method: 'put',
    data: data
  })
}

// 删除商品管理
export function delsku(skuId) {
  return request({
    url: '/manage/sku/' + skuId,
    method: 'delete',
    customErrorHandler: true  // 使用自定义错误处理
  })
}
