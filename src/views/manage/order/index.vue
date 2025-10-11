<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="订单搜索:" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单编号"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      
      <el-form-item label="选择日期:" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="orderList">
      <el-table-column label="序号" align="center" type="index" prop="id" width="100" />
      <el-table-column label="订单编号" align="center" prop="orderNo" />
      <el-table-column label="商品名称" align="center" prop="skuName" />
      <el-table-column label="订单金额" align="center" prop="price" />
      <el-table-column label="设备编号" align="center" prop="innerCode" />
      <el-table-column label="订单状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag v-if="order_status" :options="order_status" :value="scope.row.status"/>
          <span v-else>{{ scope.row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单日期" align="center" prop="createTime" width="180"></el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup name="Order">
import { listOrder } from "@/api/manage/order";

const { proxy } = getCurrentInstance();
const { order_status } = proxy.useDict('order_status');

const orderList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dateRange = ref([]);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderNo: null,
    params: {},
    beginTime: null,
    endTime: null
  }
});

const { queryParams } = toRefs(data);

/** 监听日期范围变化，自动触发查询 */
watch(dateRange, (newValue) => {
  if (newValue && newValue.length === 2) {
    // 只更新日期字段，保留其他属性
    queryParams.value.beginTime = newValue[0];
    queryParams.value.endTime = newValue[1];
  } else {
    // 清空日期字段
    queryParams.value.beginTime = null;
    queryParams.value.endTime = null;
  }
  // 日期变化时自动查询
  // handleQuery();
}, { deep: true });

/** 查询订单列表 */
function getList() {
  loading.value = true;
  listOrder(queryParams.value).then(response => {
    orderList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  // 先重置表单
  proxy.resetForm("queryRef");
  // 清空日期范围（会触发 watch 自动查询）
  dateRange.value = [];
}

getList();
</script>
