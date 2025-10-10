<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="点位名称" prop="nodeName">
        <el-input
          v-model="queryParams.nodeName"
          placeholder="请输入点位名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="区域搜索" prop="regionId">
        <el-icon ><AddLocation/> </el-icon>
        <el-select
          v-model="queryParams.regionId"
          placeholder="请选择区域"
          clearable
        >
          <el-option
            v-for="item in regionList"
            :key="item.id"
            :label="item.regionName"
            :value="item.id"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <!-- <el-form-item label="合作商ID" prop="partnerId">
        <el-input
          v-model="queryParams.partnerId"
          placeholder="请输入合作商ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item> -->
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['manage:node:add']"
          >新增</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:node:edit']"
          >修改</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:node:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:node:export']"
          >导出</el-button
        >
      </el-col>
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="nodeList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="100" align="center" />
      <el-table-column label="序号" align="center" type="index" width="100"/>
      <el-table-column label="点位名称" align="center" prop="nodeName" />
      <el-table-column
        label="所在区域"
        align="center"
        prop="regionName"
        width="100"
        show-overflow-tooltip="true"
      >
        <template #default="scope">
          {{ scope.row.region.regionName }}
        </template>
      </el-table-column>
      <el-table-column
        label="商圈类型"
        align="center"
        prop="businessType"
        width="100"
      >
        <template #default="scope">
          <dict-tag :options="business_type" :value="scope.row.businessType" />
        </template>
      </el-table-column>
      <el-table-column label="合作商" align="center" prop="partnerName">
        <template #default="scope">
          {{ scope.row.partner.partnerName }}
        </template>
      </el-table-column>
      <el-table-column
        label="详细地址"
        align="left"
        prop="addressDetail"
        show-overflow-tooltip="true"
      />
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleQueryMachine(scope.row)"
            v-hasPermi="['manage:node:list']"
          >
            <el-icon style="width: 2em"><View /> </el-icon>查看详情</el-button
          >
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['manage:node:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['manage:node:remove']"
            >删除</el-button
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

    <!-- 添加或修改点位管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="nodeRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="点位名称" prop="nodeName">
          <el-input
            v-model="form.nodeName"
            placeholder="请输入点位名称"
            style="width: 60%"
          />
        </el-form-item>
        <el-form-item label="所属区域" prop="regionId">
          <!-- <el-input v-model="form.regionId" placeholder="请输入区域ID" /> -->
          <el-select v-model="form.regionId" placeholder="请选择区域">
            <el-option
              v-for="item in regionList"
              :key="item.id"
              :label="item.regionName"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="商圈类型" prop="businessType">
          <el-select v-model="form.businessType" placeholder="请选择商圈类型">
            <el-option
              v-for="dict in business_type"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="归属合作商" prop="partnerId">
          <!-- <el-input v-model="form.partnerId" placeholder="请选择合作商" /> -->
          <el-select v-model="form.partnerId" placeholder="请选择归属合作商">
            <el-option
              v-for="item in partnerList.rows"
              :key="item.id"
              :label="item.partnerName"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="详细地址" prop="addressDetail">
          <el-input
            v-model="form.addressDetail"
            type="textarea"
            placeholder="请输入内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog title="点位详情" v-model="machine" width="500px" append-to-body>
      <el-table :data="machineData" highlight-current-row style="width: 100%">
        <el-table-column type="index" width="50" label="序号" />
        <el-table-column property="innerCode" label="设备编号" width="120" />
        <el-table-column property="status" label="设备状态" width="120">
          <template #default="scope">
            <dict-tag :options="vm_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column property="lastSupplyTime" label="最后一次供货时间" />
      </el-table>
      <template #footer>
        <el-button @click="machine = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Node">
import {
  listNode,
  getNode,
  delNode,
  addNode,
  updateNode,
  getMachine,
} from "@/api/manage/node";
import { listRegion } from "@/api/manage/region";
import { listPartner } from "@/api/manage/partner";
import { loadAllParam } from "@/api/page";

const { proxy } = getCurrentInstance();
const { business_type } = proxy.useDict("business_type");
const { vm_status } = proxy.useDict("vm_status");

const nodeList = ref([]);
const open = ref(false);
const loading = ref(true);
const machine = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const nodeNames = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    nodeName: null,
    regionId: null,
    partnerId: null,
  },
  rules: {
    nodeName: [
      { required: true, message: "点位名称不能为空", trigger: "blur" },
    ],
    regionId: [{ required: true, message: "区域不能为空", trigger: "blur" }],
    businessType: [
      { required: true, message: "商圈类型不能为空", trigger: "blur" },
    ],
    partnerId: [{ required: true, message: "合作商不能为空", trigger: "blur" }],
    addressDetail: [
      { required: true, message: "详细地址不能为空", trigger: "blur" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询点位管理列表 */
function getList() {
  loading.value = true;
  listNode(queryParams.value).then((response) => {
    nodeList.value = response.rows;
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
    nodeName: null,
    addressDetail: null,
    businessType: null,
    regionId: null,
    partnerId: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
    remark: null,
  };
  proxy.resetForm("nodeRef");
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
  nodeNames.value = selection.map((item) => item.nodeName)
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加点位管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getNode(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改点位管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["nodeRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateNode(form.value).then((response) => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addNode(form.value).then((response) => {
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
  const nodenames = row.nodeName || nodeNames.value;
  proxy.$modal
    .confirm('是否确认删除点位为"' + nodenames + '"的数据项？')
    .then(function () {
      return delNode(_ids);
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
    "manage/node/export",
    {
      ...queryParams.value,
    },
    `node_${new Date().getTime()}.xlsx`
  );
}

// 查询所有的条件对象
// const loadAllpParam = reactive({
//   pageNum: 1,
//   pageSize: 10000,
// });

// 查询区域列表
const regionList = ref([]);
function getRegionList() {
  listRegion(loadAllParam).then((response) => {
    regionList.value = response.rows;
  });
}

// 查询合作商列表
const partnerList = reactive({
  rows: [],
});
const getPartnerList = () => {
  listPartner(loadAllParam).then((response) => {
    partnerList.rows = response.rows;
  });
};
// 查看详情
const machineData = ref([]);
const handleQueryMachine = (row) => {
  machine.value = true;
  getMachine(row.id).then((response) => {
    machineData.value = response.data;
  });
};

getRegionList();
getPartnerList();
getList();
</script>
