<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="设备编号" prop="innerCode">
        <el-input
          v-model="queryParams.innerCode"
          placeholder="请输入设备编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="vmList">
      <el-table-column label="序号" type="index" width="55" align="center" />
      <el-table-column label="设备编号" align="center" prop="innerCode" />
      <el-table-column label="设备型号" align="center" prop="vmTypeId">
        <template #default="scope">
          <div v-for="vt in vmTypeList" :key="vt.id">
            <span v-if="scope.row.vmTypeId == vt.id">{{ vt.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="详细地址"
        align="left"
        prop="addr"
        show-overflow-tooltip="true"
      />
      <el-table-column label="运营状态" align="center" prop="vmStatus">
        <template #default="scope">
          <dict-tag :options="vm_status" :value="scope.row.vmStatus" />
        </template>
      </el-table-column>
      <el-table-column label="设备状态" align="center" prop="vmStatus">
        <template #default="scope">
          {{
            scope.row.runningStatus != null
              ? JSON.parse(scope.row.runningStatus).status == true
                ? "正常"
                : "异常"
              : "异常"
          }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        type="primary"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="getVmInfo(scope.row)"
            v-hasPermi="['manage:vm:query']"
            ><el-icon style="width: 1.5em"><View /></el-icon>查看详情</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 设备详情对话框 -->
    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
  <div v-loading="detailLoading">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="设备编号" align="center">{{ form.innerCode }}</el-descriptions-item>
      <el-descriptions-item label="设备型号" align="center">{{ form.vmTypeName }}</el-descriptions-item>
      <el-descriptions-item label="点位名称" align="center">{{ form.nodeName }}</el-descriptions-item>
      <el-descriptions-item label="所属区域" align="center">{{ form.regionName }}</el-descriptions-item>
      <el-descriptions-item label="合作商" align="center">{{ form.partnerName }}</el-descriptions-item>
      <el-descriptions-item label="总货道数" align="center">{{ form.channelMaxCapacity }}</el-descriptions-item>
      <el-descriptions-item label="上次补货时间" align="center">{{ form.lastSupplyTime || '暂无补货记录' }}</el-descriptions-item>
      <el-descriptions-item label="设备状态" align="center">
        {{ form.vmStatus === 1 ? '正常' : '异常' }}
      </el-descriptions-item>
           <el-descriptions-item label="运行状态" align="center" :span="2">
        {{ statusText(form) }}
      </el-descriptions-item>
      <el-descriptions-item label="详细地址" align="center" :span="2">{{ form.addr }}</el-descriptions-item>
     </el-descriptions>
  </div>
</el-dialog>
  </div>
</template>

<script setup name="Vm">
import { listVm, getVm, delVm, addVm, updateVm } from "@/api/manage/vm";
import { listVmType } from "@/api/manage/vmType";
import { listPartner } from "@/api/manage/partner";
import { loadAllParam } from "@/api/page";
import { listNode } from "@/api/manage/node";
import { listRegion } from "@/api/manage/region";

const { proxy } = getCurrentInstance();
const { vm_status } = proxy.useDict("vm_status");

const vmList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const innercodes = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const detailLoading = ref(false)

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    innerCode: null,
    nodeId: null,
    businessType: null,
    regionId: null,
    partnerId: null,
    vmTypeId: null,
    vmStatus: null,
    policyId: null,
  },
  rules: {
    nodeId: [{ required: true, message: "点位ID不能为空", trigger: "blur" }],
    vmTypeId: [
      { required: true, message: "设备型号不能为空", trigger: "blur" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);
// 查询区域列表
const regionList = ref([]);
const getRegionList = () => {
  listRegion(loadAllParam).then((response) => {
    regionList.value = response.rows;
  });
};
getRegionList();
// 查询点位列表
const nodeList = ref([]);
const getNodeList = () => {
  listNode(queryParams.value).then((response) => {
    nodeList.value = response.rows;
  });
};
getNodeList();
// 查询设备型号列表
const vmTypeList = ref([]);
const getVmTypeList = () => {
  listVmType(loadAllParam).then((response) => {
    vmTypeList.value = response.rows;
  });
  console.log(vmTypeList.value);
};
getVmTypeList();
// 查询合作商列表
const partnerList = ref([]);
const getPartnerList = () => {
  listPartner(loadAllParam).then((response) => {
    partnerList.value = response.rows;
  });
};
getPartnerList();
/** 查询设备管理列表 */
function getList() {
  loading.value = true;
  listVm(queryParams.value).then((response) => {
    vmList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
   form.value = {
    id: null,
    innerCode: null,
    channelMaxCapacity: null,
    nodeId: null,
    addr: null,
    lastSupplyTime: null,
    businessType: null,
    regionId: null,
    partnerId: null,
    vmTypeId: null,
    vmStatus: null,
    runningStatus: null,
    longitudes: null,
    latitude: null,
    clientId: null,
    policyId: null,
    createTime: null,
    updateTime: null,
    hasActiveTask: null,
    taskStatus: null,
    nodeName: null,
    regionName: null,
    partnerName: null,
    vmTypeName: null,
    runningStatusObj: null,
  };
  proxy.resetForm("vmRef");
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

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
  innercodes.value = selection.map((item) => item.innerCode);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加设备管理";
}

/** 设备详情按钮操作 */
function getVmInfo(row) {
  reset()
  const _id = row.id || ids.value
  detailLoading.value = true
  getVm(_id)
    .then((response) => {
      form.value = response.data || {}
      if (!form.value.runningStatusObj && form.value.runningStatus) {
        try { form.value.runningStatusObj = JSON.parse(form.value.runningStatus) } catch {}
      }
      open.value = true
      title.value = "设备详情"
    })
    .finally(() => { detailLoading.value = false })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["vmRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateVm(form.value).then((response) => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addVm(form.value).then((response) => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除设备为"' + innercodes.value + '"的数据项？')
    .then(function () {
      console.log(row);
      return delVm(_ids);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "manage/vm/export",
    {
      ...queryParams.value,
    },
    `vm_${new Date().getTime()}.xlsx`
  );
}
const statusText = (data) => {
  const obj = data?.runningStatusObj
  if (!obj) return '未知'
  if (obj.status === true) return `运行正常(${obj.statusCode || 'OK'})`
  return `运行异常(${obj.statusCode || 'ERR'})`
}

getList();
</script>
<style scoped>
.menuic {
  font-size: 24px;
}

.icon-celve-renwucelve {
  margin-right: 4px;
}

/* .channel-button {
  margin-right: 8px;
}  */
</style>
