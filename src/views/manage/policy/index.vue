<template>
  <div class="app-container">
    <!-- 添加 @submit.prevent 阻止表单默认提交行为，防止页面刷新 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px" @submit.prevent="handleQuery">
      <el-form-item label="策略名称" prop="policyName">
        <!-- 使用 el-autocomplete 提供联想词提示，提升搜索体验 -->
        <el-autocomplete
          v-model="queryParams.policyName"
          :fetch-suggestions="fetchPolicySuggestions"
          placeholder="请输入策略名称"
          :debounce="300"
          :trigger-on-focus="false"
          :highlight-first-item="true"
          clearable
          @keyup.enter="onSearchEnter"
          @select="onPolicySuggestSelect"
          @clear="handleQuery"
        />
      </el-form-item>
      <!-- <el-form-item label="策略方案" prop="discount">
        <el-input
          v-model="queryParams.discount"
          placeholder="请输入策略方案"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item> -->
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
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
          v-hasPermi="['manage:policy:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:policy:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:policy:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:policy:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="policyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" width="80" />
      <el-table-column label="策略名称" align="center" prop="policyName" />
      <el-table-column label="策略方案" align="center" prop="discount" />
      <el-table-column label="创建日期" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:policy:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:policy:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改策略管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="policyRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="策略名称" prop="policyName">
          <el-input v-model="form.policyName" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="策略方案" prop="discount">
          <el-input-number v-model="form.discount" type="number" min="1" max="100" placeholder="请输入策略方案" />
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

<script setup name="Policy">
import { listPolicy, getPolicy, delPolicy, addPolicy, updatePolicy } from "@/api/manage/policy";

const { proxy } = getCurrentInstance();

const policyList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const policyNames = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    policyName: null,
    discount: null,
  },
  rules: {
    policyName: [
      { required: true, message: "策略名称不能为空", trigger: "blur" }
    ],
    discount: [
      { required: true, message: "策略方案不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);
// 辅助：搜索建议缓存与防抖控制（位于 <script setup> 内部）
const suggestCache = new Map() // { key: string -> { time: number, items: Array } }
const SUGGEST_TTL = 2 * 60 * 1000 // 2 分钟缓存有效期
let suggestReqSeq = 0 // 自增序列，用于丢弃过时响应
const lastSuggestSelectedAt = ref(0) // 上次通过选择建议触发搜索的时间戳

/**
 * 搜索联想：根据输入的策略名称远程拉取候选项
 * 说明：使用 el-autocomplete 的 fetch-suggestions 回调形式
 * @param {string} queryString - 输入框当前值
 * @param {Function} cb - 回调，传入候选项数组
 */
function fetchPolicySuggestions(queryString, cb) {
  // 统一预处理：去空格、转小写用于缓存键
  const raw = queryString ?? ''
  const q = String(raw).trim()

  // 1) 最少输入 2 个字符再开始联想
  if (q.length < 2) {
    cb([])
    return
  }

  // 2) 本地缓存命中（2 分钟 TTL）
  const now = Date.now()
  const cacheKey = q.toLowerCase()
  const cacheItem = suggestCache.get(cacheKey)
  if (cacheItem && now - cacheItem.time < SUGGEST_TTL) {
    cb(cacheItem.items)
    return
  }

  // 3) 发起远程请求：按名称模糊查询，限制返回数量
  const reqId = ++suggestReqSeq
  listPolicy({ pageNum: 1, pageSize: 8, policyName: q })
    .then((res) => {
      // 若期间又发起了新请求，则丢弃旧响应
      if (reqId !== suggestReqSeq) return

      const rows = Array.isArray(res?.rows) ? res.rows : []
      // el-autocomplete 要求每项包含 value 字段
      let suggestions = rows.map(item => ({ value: item.policyName }))
      // 空态占位
      if (suggestions.length === 0) {
        suggestions = [{ value: '未找到匹配策略', __empty: true }]
      }
      // 写入缓存
      suggestCache.set(cacheKey, { time: now, items: suggestions })
      cb(suggestions)
    })
    .catch(() => {
      // 失败时给出温和的空态提示，不打断用户输入
      cb([{ value: '加载失败，请稍后重试', __empty: true }])
    })
}

/** 选择联想项时，直接执行一次查询 */
function onPolicySuggestSelect(item) {
  // 若为空态占位，忽略选择
  if (item && item.__empty) return
  // 安全赋值并触发搜索
  lastSuggestSelectedAt.value = Date.now()
  queryParams.value.policyName = item?.value ?? queryParams.value.policyName
  handleQuery()
}

/** 在输入框按下回车时触发搜索：避免与 select 事件重复 */
function onSearchEnter(event) {
  // 阻止默认的表单提交行为，防止页面刷新
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  // 若刚刚通过选择建议触发过搜索，短时间内忽略一次回车
  if (Date.now() - lastSuggestSelectedAt.value < 150) return
  
  // 执行搜索操作
  handleQuery()
}

/** 查询策略管理列表 */
function getList() {
  loading.value = true;
  listPolicy(queryParams.value).then(response => {
    policyList.value = response.rows;
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
    policyId: null,
    policyName: null,
    discount: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("policyRef");
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
  ids.value = selection.map(item => item.policyId);
  policyNames.value = selection.map(item => item.policyName);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加策略管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _policyId = row.policyId || ids.value
  getPolicy(_policyId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改策略管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["policyRef"].validate(valid => {
    if (valid) {
      if (form.value.policyId != null) {
        updatePolicy(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPolicy(form.value).then(response => {
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
  const _policyIds = row.policyId || ids.value;
  const _policyNames = row.policyName || policyNames.value;
  proxy.$modal.confirm('是否确认删除策略名称为"' + _policyNames + '"的数据项？').then(function() {
    return delPolicy(_policyIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/policy/export', {
    ...queryParams.value
  }, `policy_${new Date().getTime()}.xlsx`)
}

getList();
</script>

<!-- // 辅助：搜索建议缓存与防抖控制
// 已移至 <script setup> 内部，避免出现在 </script> 之后导致语法错误 -->
