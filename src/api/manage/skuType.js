import request from "@/utils/request";

// 查询商品管理列表
export function listskuType(query) {
  return request({
    url: "/manage/skuType/list",
    method: "get",
    params: query,
  });
}

// 查询商品管理详细
export function getskuType(classId) {
  return request({
    url: "/manage/skuType/" + classId,
    method: "get",
  });
}

// 新增商品管理
export function addskuType(data) {
  return request({
    url: "/manage/skuType",
    method: "post",
    data: data,
  });
}

// 修改商品管理
export function updateskuType(data) {
  return request({
    url: "/manage/skuType",
    method: "put",
    data: data,
  });
}

// 删除商品管理
export function delskuType(classId) {
  return request({
    url: "/manage/skuType/" + classId,
    method: "delete",
    customErrorHandler: true,
  });
}
