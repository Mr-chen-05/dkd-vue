import request from '@/utils/request'

// 查询工作量列表
export function listWork(query) {
  return request({
    url: '/manage/work/list',
    method: 'get',
    params: query
  })
}

// 查询工作量详细
export function getWork(id) {
  return request({
    url: '/manage/work/' + id,
    method: 'get'
  })
}

// 新增工作量
export function addWork(data) {
  return request({
    url: '/manage/work',
    method: 'post',
    data: data
  })
}

// 修改工作量
export function updateWork(data) {
  return request({
    url: '/manage/work',
    method: 'put',
    data: data
  })
}

// 删除工作量
export function delWork(id) {
  return request({
    url: '/manage/work/' + id,
    method: 'delete'
  })
}