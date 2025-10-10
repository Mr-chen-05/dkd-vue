import defaultSettings from '@/settings';
<style scoped>
.mb8 {
  margin-bottom: 20px;
}
</style>
<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="合作商搜索" prop="partnerName" label-width="85px">
        <el-input
          v-model="queryParams.partnerName"
          placeholder="请输入合作商名称"
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

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['manage:partner:add']"
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
          v-hasPermi="['manage:partner:edit']"
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
          v-hasPermi="['manage:partner:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:partner:export']"
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
      :data="partnerList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" align="center" width="100" />
      <el-table-column
        label="合作商名称"
        align="center"
        prop="partnerName"
        width="260"
      />
      <el-table-column label="账号" align="center" prop="account" width="130" />
      <el-table-column
        label="点位数"
        align="center"
        prop="nodeCount"
        width="150"
      />
      <el-table-column label="分成比例" align="center" width="150">
        <template #default="scope">
          <el-tag>{{ scope.row.profitRatio }}%</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="联系人"
        align="center"
        prop="contactPerson"
        width="120"
      />
      <el-table-column
        label="联系电话"
        align="center"
        prop="phone"
        width="150"
      />

      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            style="color: #00e0ff"
            @click="handleReset(scope.row)"
            v-hasPermi="['manage:partner:edit']"
          >
            <el-icon style="width: 2em"><RefreshRight /></el-icon>
            重置密码</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleQueryOne(scope.row)"
            v-hasPermi="['manage:partner:query']"
          >
            <el-icon style="width: 2em"><View /> </el-icon>
            查看详情</el-button
          >
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['manage:partner:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['manage:partner:remove']"
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

    <!-- 添加或修改合作商管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form
        ref="partnerRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="合作商名称" prop="partnerName">
          <el-input v-model="form.partnerName" placeholder="请输入合作商名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          {{ form.createTime || '-' }}
        </el-form-item>
        <el-form-item label="分成比例" prop="profitRatio">
          <el-input v-model="form.profitRatio" placeholder="请输入分成比例" >
            %
          </el-input>
        </el-form-item>
        <el-form-item label="账号" prop="account" v-if="form.id == null">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="form.id == null">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark" v-if="form.id == null">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 个人详情显示 -->
    <el-dialog
      v-model="onePersonDialog"
      title="合作商详情"
      width="500"
      append-to-body
    >
      <el-descriptions :column="1" border class="mb-10">
        <el-descriptions-item label="合作商名称">
          {{ mySelfData.partnerName || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ mySelfData.contactPerson || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ mySelfData.phone || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="分成比例">
          <el-tag>{{ mySelfData.profitRatio }}%</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账号">
          {{ mySelfData.account || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ mySelfData.createBy || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          <span v-if="mySelfData.remark">{{ mySelfData.remark }}</span>
          <el-tag v-else type="info">暂无备注</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{
            mySelfData.createTime
              ? dayjs(mySelfData.createTime).format("YYYY-MM-DD HH:mm:ss")
              : "—"
          }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{
            mySelfData.updateTime
              ? dayjs(mySelfData.updateTime).format("YYYY-MM-DD HH:mm:ss")
              : "—"
          }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="onePersonDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Partner">
import {
  listPartner,
  getPartner,
  delPartner,
  addPartner,
  updatePartner,
  resetPwdPartner,
} from "@/api/manage/partner";
import { ref, reactive, toRefs, getCurrentInstance } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

const { proxy } = getCurrentInstance();

const partnerList = ref([]);
const mySelfData = ref();
const open = ref(false);

const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const partnerNames = ref([])
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    partnerName: null,
  },
  rules: {
    partnerName: [
      { required: true, message: "合作商名称不能为空", trigger: "blur" },
    ],
    contactPerson: [
      { required: true, message: "联系人不能为空", trigger: "blur" },
    ],
    phone: [{ required: true, message: "联系电话不能为空", trigger: "blur" }],
    profitRatio: [
      { required: true, message: "分成比例不能为空", trigger: "blur" },
    ],
    account: [{ required: true, message: "账号不能为空", trigger: "blur" }],
    password: [{ required: true, message: "密码不能为空", trigger: "blur" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询合作商管理列表 */
function getList() {
  loading.value = true;
  listPartner(queryParams.value).then((response) => {
    // ✅ 安全处理数据
    partnerList.value = Array.isArray(response.rows) ? response.rows : [];
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  // 延迟重置表单，避免在对话框关闭动画期间显示添加模式的表单字段
  setTimeout(() => {
    reset();
  }, 200);
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    partnerName: null,
    contactPerson: null,
    phone: null,
    profitRatio: null,
    account: null,
    password: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
    remark: null,
  };
  proxy.resetForm("partnerRef");
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
  partnerNames.value = selection.map((item) => item.partnerName)
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加合作商管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getPartner(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改合作商管理";
  });
}
/** 个人详情按钮操作 */
const onePersonDialog = ref(false);
function handleQueryOne(row) {
  reset();
  const _id = row.id;
  getPartner(_id).then((response) => {
    mySelfData.value = response.data;
    onePersonDialog.value = true;
    title.value = "个人详情";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["partnerRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updatePartner(form.value).then((response) => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPartner(form.value).then((response) => {
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
  const _partnerNames = row.partnerName || partnerNames.value
  proxy.$modal
    .confirm('是否确认删除合作商为"' + _partnerNames + '"的数据项？')
    .then(function () {
      return delPartner(_ids);
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
    "manage/partner/export",
    {
      ...queryParams.value,
    },
    `partner_${new Date().getTime()}.xlsx`
  );
}

/** 重置密码操作 */
function handleReset(row) {
  const _id = row.id;
  proxy.$modal
    .confirm('是否确认重置合作商"' + row.partnerName + '"的密码？')
    .then(async function () {
      // 这里需要根据实际API添加重置密码的请求
      const result = await resetPwdPartner(_id);
      if (result.code === 200) {
        proxy.$modal.msgSuccess("重置成功");
      } else {
        proxy.$modal.msgError(result.message);
      }
    })
    .catch(() => {
      // 取消
      ElMessage.info("您已取消重置");
    });
}

getList();
</script>
