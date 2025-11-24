<template>
  <div class="box abnormal-equipment">
    <div class="header">
      <div class="title">异常设备监控</div>
      <el-dropdown @command="handleCommand" trigger="click">
        <el-icon class="dropdown-icon"><MoreFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="viewVm">
              <el-icon><Notebook /></el-icon>
              查看设备管理
            </el-dropdown-item>
            <el-dropdown-item command="viewStatus">
              <el-icon><Monitor /></el-icon>
              查看设备状态
            </el-dropdown-item>
            <el-dropdown-item command="createTask" divided>
              <el-icon><CirclePlus /></el-icon>
              一键创建工单
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <el-scrollbar v-if="listData.length" class="scrollbar body">
      <el-table
        :data="listData"
        fit
        highlight-current-row
        style="width: 100%"
        :header-cell-style="{
          padding: '7px 0 6px',
          background: '#EFF0F2',
          'font-weight': '400',
          'text-align': 'left',
          color: '#333333',
        }"
        :cell-style="{
          padding: '15px 0',
          'text-align': 'left',
          color: '#999999',
        }"
      >
        <el-table-column label="故障时间" width="160px">
          <template #default="scope">
            <span>{{ scope.row.updateTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备地址" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ scope.row.addr }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备编号" width="120px">
          <template #default="scope">
            <span>{{ scope.row.innerCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100px" align="center">
          <template #default="scope">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleCreateSingleTask(scope.row)"
            >
              <el-icon><Tools /></el-icon>
              创建工单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-scrollbar>
    <!-- TODO：一开始显示加载中 -->
    <div v-else class="empty">
      <img src="@/assets/images/empty.png" />
      <div class="tips">暂无数据</div>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElLoading } from "element-plus";
import { getAbnormalEquipmentList } from "@/api/home/homePage";
import { addTask } from "@/api/manage/task";

// 定义变量
const router = useRouter();
const listData = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const data = await getAbnormalEquipmentList({ limit: 10 });
    listData.value = Array.isArray(data) ? data : [];
  } catch (e) {
    ElMessage.error("异常设备数据加载失败");
    listData.value = [];
  } finally {
    loading.value = false;
  }
});

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case "viewVm":
      router.push("/manage/vm");
      break;
    case "viewStatus":
      router.push("/manage/vmStatus");
      break;
    case "createTask":
      handleCreateBatchTask();
      break;
  }
};

// 为单个设备创建工单
const handleCreateSingleTask = async (vm) => {
  ElMessageBox.confirm(
    `确认为设备 ${vm.innerCode} 创建维修工单？<br/>故障时间：${
      vm.updateTime
    }<br/>设备地址：${vm.addr || "未知"}`,
    "创建工单确认",
    {
      type: "warning",
      confirmButtonText: "立即创建",
      cancelButtonText: "取消",
      dangerouslyUseHTMLString: true,
    }
  )
    .then(async () => {
      const loadingInstance = ElLoading.service({
        lock: true,
        text: "正在创建工单...",
      });

      try {
        await addTask({
          innerCode: vm.innerCode,
          productTypeId: 1,
          desc: `设备异常自动创建工单 - ${vm.addr || "未知地址"}`,
          assignorId: null,
        });

        loadingInstance.close();

        ElMessageBox.confirm(
          "工单创建成功！是否立即查看工单列表？",
          "创建成功",
          {
            type: "success",
            confirmButtonText: "查看工单",
            cancelButtonText: "关闭",
          }
        )
          .then(() => {
            router.push("/manage/task/operation");
          })
          .catch(() => {});
      } catch (error) {
        loadingInstance.close();
        console.error("创建工单失败:", error);
        // 错误已由全局拦截器处理
      }
    })
    .catch(() => {});
};

// 一键批量创建工单
const handleCreateBatchTask = async () => {
  if (!listData.value.length) {
    ElMessage.warning("暂无异常设备，无需创建工单");
    return;
  }

  const count = listData.value.length;
  const actionText =
    count === 1
      ? "为该设备创建维修工单"
      : `为这 ${count} 台设备批量创建维修工单`;

  ElMessageBox.confirm(
    `检测到 ${count} 台异常设备，是否${actionText}？`,
    "创建工单确认",
    {
      type: "warning",
      confirmButtonText: "立即创建",
      cancelButtonText: "取消",
    }
  )
    .then(async () => {
      const loadingInstance = ElLoading.service({
        lock: true,
        text: "正在创建工单...",
        background: "rgba(0, 0, 0, 0.7)",
      });

      try {
        let successCount = 0;
        let failCount = 0;
        let lastErrorMsg = "";

        for (const vm of listData.value) {
          try {
            await addTask({
              innerCode: vm.innerCode,
              productTypeId: 1,
              desc: `设备异常自动创建工单 - ${vm.addr || "未知地址"}`,
              assignorId: null,
            });
            successCount++;
          } catch (error) {
            lastErrorMsg =
              error?.response?.data?.msg ||
              error?.response?.data?.message ||
              error?.message ||
              error?.msg ||
              `设备${vm.innerCode}创建失败`;

            console.error(`设备 ${vm.innerCode} 创建工单失败:`, error);
            failCount++;
          }
        }

        loadingInstance.close();

        // 显示结果
        if (successCount > 0) {
          const resultMsg =
            failCount > 0
              ? `成功创建 ${successCount} 个工单，${failCount} 个失败（${lastErrorMsg}）。是否立即查看工单列表？`
              : `成功创建 ${successCount} 个工单。是否立即查看工单列表？`;

          ElMessageBox.confirm(resultMsg, "创建成功", {
            type: "success",
            confirmButtonText: "查看工单",
            cancelButtonText: "稍后查看",
          })
            .then(() => {
              router.push("/manage/task/operation");
            })
            .catch(() => {});
        } else {
          // 全部失败，错误已由全局拦截器处理，这里只记录日志
          console.log("所有设备创建工单均失败");
        }
      } catch (error) {
        loadingInstance.close();
        console.error("批量创建工单失败:", error);
        // 错误已由全局拦截器处理
      }
    })
    .catch(() => {});
};
</script>
<style lang="scss" scoped>
@import "@/assets/styles/variables.module.scss";

.abnormal-equipment {
  display: flex;
  flex-direction: column;
  height: calc((100vh - 120px) * 0.4);
  min-height: 353px;
  background: #ffffff;
  border-radius: 20px;

  .dropdown-icon {
    cursor: pointer;
    font-size: 20px;

    &:hover {
      color: $--color-primary;
    }
  }

  .more {
    color: $--color-primary;
    cursor: pointer;
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .tips {
      margin-top: 25px;
      color: #20232a;
      font-size: 14px;
    }
  }

  .body {
    flex: 1;
    margin-top: 20px;
  }
}
</style>