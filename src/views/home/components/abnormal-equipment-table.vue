<template>
  <div class="box abnormal-equipment">
    <div class="header">
      <div class="title">异常设备监控</div>
      <div class="header-actions">
        <el-switch
          v-model="autoRefreshEnabled"
          size="small"
          active-text="自动刷新"
          inactive-text="手动"
        />
        <div class="interval-setting">
          <el-input-number
            v-model="autoRefreshInterval"
            size="small"
            :min="3"
            :max="60"
            :step="1"
            :disabled="!autoRefreshEnabled"
            controls-position="right"
          />
          <span class="interval-unit">秒</span>
        </div>
        <el-button
          class="refresh-btn"
          circle
          :loading="loading"
          :disabled="loading"
          @click="reloadList()"
          type="text"
          style="color:#000"
          title="刷新异常设备列表"
        >
          <el-icon><RefreshRight /></el-icon>
        </el-button>
        <el-dropdown @command="handleCommand" trigger="click">
          <el-icon class="dropdown-icon"><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="createTask">
                <el-icon><CirclePlus /></el-icon>
                一键创建工单
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
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
              v-if="!scope.row.hasActiveTask"
              link
              type="primary"
              size="small"
              @click="handleCreateSingleTask(scope.row)"
            >
              <el-icon><Tools /></el-icon>
              创建工单
            </el-button>
            <span v-else style="color: #909399; font-size: 12px">
              {{ getTaskStatusText(scope.row.taskStatus) }}
            </span>
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
import { onMounted, ref, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElLoading } from "element-plus";
import {
  MoreFilled,
  Tools,
  CirclePlus,
  RefreshRight,
} from "@element-plus/icons-vue"; // 新增 RefreshRight
import { getAbnormalEquipmentList } from "@/api/home/homePage";
import { addTask, getOperationList } from "@/api/manage/task";
import request from "@/utils/request";

// 定义变量
const router = useRouter();
const listData = ref([]);
const loading = ref(true);
const autoRefreshTimer = ref(null);
const autoRefreshEnabled = ref(true);
const autoRefreshInterval = ref(5);

onMounted(async () => {
  // 首次加载，调用统一的刷新方法
  await reloadList();
  startAutoRefresh();
});

onBeforeUnmount(() => {
  stopAutoRefresh();
});

const startAutoRefresh = () => {
  stopAutoRefresh();
  if (!autoRefreshEnabled.value) {
    return;
  }
  const intervalMs = Math.max(3, autoRefreshInterval.value) * 1000;
  autoRefreshTimer.value = setInterval(() => {
    if (!loading.value) {
      reloadList();
    }
  }, intervalMs);
};

const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value);
    autoRefreshTimer.value = null;
  }
};

watch([autoRefreshEnabled, autoRefreshInterval], () => {
  startAutoRefresh();
});

// 刷新异常设备列表（支持限制条数）
// 说明：封装统一刷新逻辑，便于在创建工单成功后复用
const reloadList = async (limit = 10) => {
  loading.value = true;
  try {
    const data = await getAbnormalEquipmentList({ limit });
    listData.value = Array.isArray(data) ? data : [];
  } catch (e) {
    ElMessage.error("异常设备数据加载失败");
    listData.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === "createTask") {
    handleCreateBatchTask();
  }
};

/**
 * 获取工单状态文案
 * @param {number} taskStatus - 工单状态 1-待办 2-进行 3-取消 4-完成
 * @returns {string} 状态文案
 */
const getTaskStatusText = (taskStatus) => {
  const statusMap = {
    1: "工单已创建",
    2: "工单进行中",
    3: "工单已取消",
    4: "工单已完成",
  };
  return statusMap[taskStatus] || "工单进行中";
};

/**
 * 智能分配运维人员
 * @param {string} innerCode - 设备编号
 * @returns {Promise<{userId: number, userName: string} | null>}
 */
const assignOperationUser = async (innerCode) => {
  try {
    // 1. 获取该设备区域的运维人员列表
    const response = await getOperationList(innerCode);
    const userList = response.data || [];

    if (!userList || userList.length === 0) {
      console.error(`设备 ${innerCode} 没有可用的运维人员`);
      return null;
    }

    // 2. 如果只有一个运维人员，直接返回
    if (userList.length === 1) {
      return {
        userId: userList[0].id,
        userName: userList[0].userName,
      };
    }

    // 3. 查询每个运维人员的工作量
    const userWorkloads = await Promise.all(
      userList.map(async (user) => {
        try {
          const workloadRes = await request({
            url: `/manage/emp/empWorkload/${user.id}`,
            method: "get",
          });
          const workloadData =
            workloadRes.data && workloadRes.data.length > 0
              ? workloadRes.data[0]
              : null;
          return {
            userId: user.id,
            userName: user.userName,
            // 本月进行中的工单数，如果没有数据则为0
            progressCount: workloadData?.progressCountMonth || 0,
          };
        } catch (error) {
          console.error(`查询运维人员 ${user.userName} 工作量失败:`, error);
          return {
            userId: user.id,
            userName: user.userName,
            progressCount: 0,
          };
        }
      })
    );

    // 4. 选择工作量最少的运维人员
    const selectedUser = userWorkloads.reduce((min, current) => {
      return current.progressCount < min.progressCount ? current : min;
    });

    console.log(
      `智能分配结果: ${selectedUser.userName}（当前工单数: ${selectedUser.progressCount}）`
    );

    return {
      userId: selectedUser.userId,
      userName: selectedUser.userName,
    };
  } catch (error) {
    console.error("智能分配运维人员失败:", error);
    return null;
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
        text: "正在智能分配运维人员并创建工单...",
      });

      try {
        // 智能分配运维人员
        const assignedUser = await assignOperationUser(vm.innerCode);

        if (!assignedUser) {
          loadingInstance.close();
          ElMessage.error(
            `设备 ${vm.innerCode} 所在区域没有可用的运维人员，无法创建工单`
          );
          return;
        }

        // 根据设备状态判断工单类型
        const isDeployment = vm.vmStatus === 0;
        const isRepair = vm.vmStatus === 1 || vm.vmStatus === 2;

        if (!isDeployment && !isRepair) {
          loadingInstance.close();
          ElMessage.warning(
            `设备 ${vm.innerCode} 的状态为“已撤机”，无法创建工单。`
          );
          return;
        }

        const productTypeId = isDeployment ? 1 : 3;
        const desc = isDeployment
          ? `设备投放工单
投放时间：${vm.updateTime}
设备地址：${vm.addr || "未知地址"}
分配运维人员：${assignedUser.userName}`
          : `设备异常自动创建工单
故障时间：${vm.updateTime}
设备地址：${vm.addr || "未知地址"}
分配运维人员：${assignedUser.userName}`;
        // 创建工单
        await addTask({
          createType: 1,
          innerCode: vm.innerCode,
          productTypeId,
          userId: assignedUser.userId,
          desc,
          assignorId: null,
        });

        loadingInstance.close();

        // 乐观更新：按钮立即切换为“工单进行中”，设备不移除
        vm.hasActiveTask = true;

        // 与后端对齐：重新拉取异常设备数据
        await reloadList();

        ElMessageBox.confirm(
          `工单创建成功！已分配给运维人员：${assignedUser.userName}<br/>是否立即查看工单列表？`,
          "创建成功",
          {
            type: "success",
            confirmButtonText: "查看工单",
            cancelButtonText: "关闭",
            dangerouslyUseHTMLString: true,
          }
        )
          .then(() => {
            router.push("/task/operation");
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
  // 过滤掉已有工单的设备
  const availableDevices = listData.value.filter((item) => !item.hasActiveTask);

  if (availableDevices.length === 0) {
    ElMessage.warning("当前所有异常设备均已有进行中的工单，无需创建");
    return;
  }

  const count = availableDevices.length;
  const totalCount = listData.value.length;
  const skipCount = totalCount - count;

  let confirmMsg = `检测到 ${count} 台需要维修的设备，是否批量创建工单？`;
  if (skipCount > 0) {
    confirmMsg = `检测到 ${totalCount} 台异常设备，其中 ${skipCount} 台已有工单。<br/>是否为其余 ${count} 台设备创建工单？`;
  }

  ElMessageBox.confirm(
    `${confirmMsg}<br/><span style="color: #909399; font-size: 12px;">系统将智能分配运维人员</span>`,
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
        text: "正在智能分配运维人员并批量创建工单...",
        background: "rgba(0, 0, 0, 0.7)",
      });

      try {
        let successCount = 0;
        let failCount = 0;
        let noUserCount = 0; // 没有运维人员的设备数
        let decommissionedCount = 0; // 已撤机设备数
        let lastErrorMsg = "";

        for (const vm of availableDevices) {
          try {
            // 根据设备状态判断工单类型
            const isDeployment = vm.vmStatus === 0;
            const isRepair = vm.vmStatus === 1 || vm.vmStatus === 2;

            if (!isDeployment && !isRepair) {
              decommissionedCount++;
              console.warn(`设备 ${vm.innerCode} 状态为“已撤机”，跳过创建工单。`);
              continue;
            }

            // 智能分配运维人员
            const assignedUser = await assignOperationUser(vm.innerCode);

            if (!assignedUser) {
              noUserCount++;
              console.warn(`设备 ${vm.innerCode} 没有可用的运维人员，跳过`);
              continue;
            }

            const productTypeId = isDeployment ? 1 : 3;
            const desc = isDeployment
              ? `设备投放工单
投放时间：${vm.updateTime}
设备地址：${vm.addr || "未知地址"}
分配运维人员：${assignedUser.userName}`
              : `设备异常自动创建工单
故障时间：${vm.updateTime}
设备地址：${vm.addr || "未知地址"}
分配运维人员：${assignedUser.userName}`;
            // 创建工单
            await addTask({
              innerCode: vm.innerCode,
              productTypeId,
              createType: 1,
              userId: assignedUser.userId,
              desc,
              assignorId: null,
            });
            // 乐观更新：立即切换按钮为“工单进行中”，设备保留在列表
            vm.hasActiveTask = true;
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

        // 与后端对齐：批量完成后统一刷新异常设备列表
        await reloadList();

        // 显示结果
        if (successCount > 0) {
          let resultMsg = `成功创建 ${successCount} 个工单`;
          if (decommissionedCount > 0) {
            resultMsg += `，跳过 ${decommissionedCount} 台已撤机设备`;
          }
          if (noUserCount > 0) {
            resultMsg += `，${noUserCount} 台设备无可用运维人员`;
          }
          if (failCount > 0) {
            resultMsg += `，${failCount} 个失败（${lastErrorMsg}）`;
          }
          resultMsg += "。是否立即查看工单列表？";

          ElMessageBox.confirm(resultMsg, "创建成功", {
            type: "success",
            confirmButtonText: "查看工单",
            cancelButtonText: "稍后查看",
          })
            .then(() => {
              router.push("/task/operation");
            })
            .catch(() => {});
        } else {
          // 全部失败
          let errorMsg = "工单创建失败";
          if (noUserCount > 0) {
            errorMsg = `所有设备（${noUserCount}台）都没有可用的运维人员`;
          }
          ElMessage.error(errorMsg);
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

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .interval-setting {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .interval-unit {
      color: #909399;
      font-size: 12px;
    }

    .refresh-btn {
      margin-right: 8px;
    }

    .dropdown-icon {
      cursor: pointer;
      font-size: 20px;
      &:hover {
        color: $--color-primary;
      }
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
// 刷新按钮添加悬浮态颜色为主题蓝色
.refresh-btn:hover,
.refresh-btn:focus {
  color: $--color-primary !important;
}
</style>
