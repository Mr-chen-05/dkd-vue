<template>
  <div class="app-container emp-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="人员名称" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入人员名称"
          clearable
          @keyup.enter="handleQuery"
          style="width: 200px;"
        />
      </el-form-item>
      <el-form-item label="负责区域" prop="regionId">
        <!-- <el-input
          v-model="queryParams.regionId"
          placeholder="请选择负责区域"
          clearable
          @keyup.enter="handleQuery"
        /> -->
        <el-select
          v-model="queryParams.regionId"
          placeholder="请选择负责区域"
          clearable
          @keyup.enter="handleQuery"
        >
          <el-option
            v-for="r in regionList"
            :key="r.id"
            :label="r.regionName"
            :value="r.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="角色" prop="roleCode">
        <!-- <el-input
          v-model="queryParams.roleCode"
          placeholder="请输入角色"
          clearable
          @keyup.enter="handleQuery"
        /> -->
        <el-select
          v-model="queryParams.roleCode"
          placeholder="请选择角色"
          clearable
          @keyup.enter="handleQuery"
        >
          <el-option
            v-for="r in roleList"
            :key="r.id"
            :label="r.roleName"
            :value="r.roleCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="员工状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择员工状态"
          clearable
        >
          <el-option
            v-for="dict in emp_staus"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- <br/> -->
      <el-form-item >
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
          v-hasPermi="['manage:emp:add']"
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
          v-hasPermi="['manage:emp:edit']"
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
          v-hasPermi="['manage:emp:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:emp:export']"
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
      :data="empList"
      @selection-change="handleSelectionChange"
      class="emp-table"
      :max-height="700"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" align="center" width="80" />
      <el-table-column label="人员名称" align="center" prop="userName" />
      <el-table-column label="归属区域" align="center" prop="regionName" />
      <el-table-column label="角色名称" align="center" prop="roleName" />
      <el-table-column label="联系电话" align="center" prop="mobile" />
      <el-table-column label="员工头像" align="center" prop="image" width="100">
        <template #default="scope">
          <image-preview :src="scope.row.image" :width="50" :height="50" />
        </template>
      </el-table-column>
      <el-table-column label="员工状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'primary' : 'danger'">
            <dict-tag :options="emp_staus" :value="scope.row.status" />
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['manage:emp:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['manage:emp:remove']"
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
      class="pagination"
    />

    <!-- 添加或修改人员列表对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="empRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="人员名称" prop="userName">
          <el-input v-model="form.userName" placeholder="请输入人员名称" />
        </el-form-item>
        <el-form-item label="负责区域" prop="regionId">
          <!-- <el-input v-model="form.regionId" placeholder="请输入负责区域" /> -->
          <el-select v-model="form.regionId" placeholder="请选择负责区域">
            <el-option
              v-for="r in regionList"
              :key="r.id"
              :label="r.regionName"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <!-- <el-input v-model="form.roleCode" placeholder="请选择角色" /> -->
          <el-select v-model="form.roleId" placeholder="请选择角色" @change="handleRoleChange">
            <el-option
              v-for="r in roleList"
              :key="r.roleId"
              :label="r.roleName"
              :value="r.roleId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="员工头像" prop="image">
          <image-upload v-model="form.image" />
        </el-form-item>
        <el-form-item label="员工状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in emp_staus"
              :key="dict.value"
              :label="parseInt(dict.value)"
              >{{ dict.label }}</el-radio
            >
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Emp">
import { listEmp, getEmp, delEmp, addEmp, updateEmp } from "@/api/manage/emp";
import { loadAllParam } from "@/api/page";
import { listRegion } from "@/api/manage/region";
import { listRole } from "@/api/manage/role";

const { proxy } = getCurrentInstance();
const { emp_staus } = proxy.useDict("emp_staus");

const empList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const userNames = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: null,
    regionId: null,
    roleCode: null,
    status: null,
  },
  rules: {
    userName: [
      { required: true, message: "人员名称不能为空", trigger: "blur" },
    ],
    regionId: [
      { required: true, message: "负责区域不能为空", trigger: "blur" },
    ],
    roleId: [{ required: true, message: "角色不能为空", trigger: "blur" }],
    mobile: [{ required: true, message: "联系电话不能为空", trigger: "blur" }],
    image: [{ required: true, message: "员工头像不能为空", trigger: "blur" }],
    status: [
      { required: true, message: "员工状态不能为空", trigger: "change" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

function handleRoleChange(roleId) {
  console.log("传进来的 roleId 是:", roleId);
  console.log("当前的 roleList 是:", JSON.parse(JSON.stringify(roleList.value)));
  const role = roleList.value.find((item) => item.roleId == roleId);
  console.log("role:", role.roleCode);
  if (role) {
    form.value.roleCode = role.roleCode;
    form.value.roleName = role.roleName;
    console.log("找到了 role:", role);
  } else {
    console.log("没找到 role!");
  }
}

// 查询区域列表
const regionList = ref([]);
const getRegionList = () => {
  listRegion(loadAllParam).then((response) => {
    regionList.value = response.rows;
  });
};
getRegionList();
// 查询角色列表
const roleList = ref([]);
const getRoleList = () => {
  listRole(loadAllParam).then((response) => {
    roleList.value = response.rows;

  });
};
getRoleList();

/** 查询人员列表列表 */
function getList() {
  loading.value = true;
  listEmp(queryParams.value).then((response) => {
    empList.value = response.rows;
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
    userName: null,
    regionId: null,
    regionName: null,
    roleId: null,
    roleCode: null,
    roleName: null,
    mobile: null,
    image: null,
    status: null,
    createTime: null,
    updateTime: null,
  };
  proxy.resetForm("empRef");
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
  userNames.value = selection.map((item) => item.userName);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加人员列表";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  
  getEmp(_id).then((response) => {
    Object.assign(form.value, response.data);
    open.value = true;
    title.value = "修改人员列表";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["empRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateEmp(form.value).then((response) => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addEmp(form.value).then((response) => {
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
  const _userNames = row.userName || userNames.value;
  proxy.$modal
    .confirm('是否确认删除人员"' + _userNames + '"的数据项？')
    .then(function () {
      return delEmp(_ids);
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
    "manage/emp/export",
    {
      ...queryParams.value,
    },
    `emp_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>

<style scoped>
.emp-container {
  height: calc(100vh - 180px);
  min-height: 400px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}

.emp-table {
  flex: 1;
  overflow: auto;
  min-height: 250px;
  max-height: 450px;
}

.mb8 {
  margin-bottom: 8px;
  flex-shrink: 0;
}

el-form {
  flex-shrink: 0;
}

.pagination {
  flex-shrink: 0;
  margin-top: 16px;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

/* 当开发者工具打开时的适配 */
@media screen and (max-height: 800px) {
  .emp-container {
    height: calc(100vh - 140px);
    max-height: calc(100vh - 140px);
  }
  
  .emp-table {
    max-height: 350px;
  }
}

@media screen and (max-height: 600px) {
  .emp-container {
    height: calc(100vh - 120px);
    max-height: calc(100vh - 120px);
  }
  
  .emp-table {
    min-height: 180px;
    max-height: 280px;
  }
}
</style>
