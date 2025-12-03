<template>
  <div class="app-container">
    <!-- 查询条件区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="人员姓名" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入人员姓名"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="角色">
        <el-radio-group v-model="queryParams.roleCode">
           <el-radio label="">全部</el-radio> 
          <el-radio
              v-for="dict in role_type"
              :key="dict.value"
              :label="parseInt(dict.value)"
              >{{ dict.label }}</el-radio
            >
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="workList">
      <el-table-column label="序号" align="center" type="index" width="80"  />
      <el-table-column label="人员名称" align="center" prop="userName" />
      <el-table-column label="角色" align="center" prop="roleName" />
        
      <el-table-column label="联系电话" align="center" prop="mobile" />
      <el-table-column label="完成工单(本月)" align="center" width="120" >
        <template #default="scope">
          {{ scope.row.finishCountMonth || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="进行中工单" align="center" width="120" >
        <template #default="scope">
          {{ scope.row.progressCountMonth || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="拒绝工单(本月)" align="center" width="120" >
        <template #default="scope">
          {{ scope.row.cancelCountMonth || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleDetail(scope.row)"
            v-hasPermi="['manage:empworkload:query']"
          ><el-icon style="width: 1.5em"><View /></el-icon>查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 人员详情对话框 -->
    <el-dialog title="人员详情" v-model="detailOpen" width="700px" append-to-body>
      <div class="detail-content">
        <!-- 人员基本信息 -->
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">人员名称：</span>
            <span class="info-value">{{ detailData.userName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">角色：</span>
            <span class="info-value">{{ detailData.roleName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话：</span>
            <span class="info-value">{{ detailData.mobile }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">负责区域：</span>
            <span class="info-value">{{ detailData.regionName }}</span>
          </div>
        </div>

        <!-- 工作统计表格 -->
        <div class="statistics-section">
          <el-table :data="workStatisticsData" border style="width: 100%;">
            <el-table-column label="" prop="period" width="80" align="center" />
            <el-table-column label="总工单数" prop="totalOrders" align="center" />
            <el-table-column label="完成工单" prop="finishCount" align="center" />
            <el-table-column label="拒绝工单" prop="cancelCount" align="center" />
            <el-table-column label="进行中工单" prop="progressCount" align="center" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="detailOpen = false">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Work">
import { listEmpWork, getEmpWorkDetail } from "@/api/manage/emp";

const { proxy } = getCurrentInstance();
const { role_type } = proxy.useDict("role_type");

const workList = ref([]);
const detailData = ref({}); // 详情数据
const workStatisticsData = ref([]); // 工作统计数据
const detailOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: null,
    roleCode: ""
  }
});

const { queryParams } = toRefs(data);

/** 查询工作量列表 */
function getList() {
  loading.value = true;
  listEmpWork(queryParams.value).then((response) => {

    workList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  }).catch(() => {
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
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 查看详情按钮操作 */
function handleDetail(row) {
  console.log('选中员工数据:', row); // 调试日志
  
  // 调用详情接口获取完整数据
  getEmpWorkDetail(row.userId || row.id).then((response) => {
    console.log('详情接口响应:', response);
    if (response.data && response.data.length > 0) {
      const empData = response.data[0];
      detailData.value = empData;
      
      // 生成统计数据
      workStatisticsData.value = [
        {
          period: '本周',
          totalOrders: (empData.finishCountWeek || 0) + (empData.progressCountWeek || 0) + (empData.cancelCountWeek || 0),
          finishCount: empData.finishCountWeek || 0,
          cancelCount: empData.cancelCountWeek || 0,
          progressCount: empData.progressCountWeek || 0
        },
        {
          period: '本月',
          totalOrders: (empData.finishCountMonth || 0) + (empData.progressCountMonth || 0) + (empData.cancelCountMonth || 0),
          finishCount: empData.finishCountMonth || 0,
          cancelCount: empData.cancelCountMonth || 0,
          progressCount: empData.progressCountMonth || 0
        },
        {
          period: '本年',
          totalOrders: (empData.finishCountYear || 0) + (empData.progressCountYear || 0) + (empData.cancelCountYear || 0),
          finishCount: empData.finishCountYear || 0,
          cancelCount: empData.cancelCountYear || 0,
          progressCount: empData.progressCountYear || 0
        }
      ];
      
      detailOpen.value = true;
    }
  }).catch((error) => {
    console.error('获取详情失败:', error);
    proxy.$modal.msgError('获取人员详情失败');
  });
}

getList();
</script>

<style scoped>
.detail-content {
  padding: 10px 35px;
}

.detail-content h4 {
  color: #303133;
  font-weight: 600;
}

.dialog-footer {
  text-align: right;
}

.app-container {
  padding: 20px;
}

.mb8 {
  margin-bottom: 8px;
}

/* 人员信息区域 */
.info-section {
  padding: 20px 0px;
  margin: 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 0;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 75px;
  font-weight: 500;
  color: #606266;
  text-align: right;
  margin-right: 10px    ;
}

.info-value {
  color: #303133;
  font-size: 14px;
}

/* 统计表格区域 */
.statistics-section {
  padding: 0;
  margin-top: 20px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border: 1px solid #ebeef5;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #909399;
  font-weight: 500;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-dialog__body) {
  padding: 20px 0 0 0;
}
</style>