# Project: 帝可得智能售货机管理系统 (dkd-vue)
_Last updated: 2025-01-10_
_Phase: 开发维护阶段 | Progress: 85% | Next Milestone: 功能优化和部署配置完善_

## 📌 Pinned
<!-- 关键约束、接口要求、不可变规则 -->
- 2025-09-28: 基于RuoYi框架的Vue3管理系统，不可随意更改核心架构 #P001
- 2025-09-28: 后端API地址固定为127.0.0.1:8080，代理配置/dev-api #P002
- 2025-09-28: Element Plus作为主要UI组件库，保持中文本地化配置 #P003

## 🎯 Decisions
<!-- 重大决策、方案选择、架构确定 -->
- 2025-09-28: 采用Vue3 + Composition API架构模式 (related: #P001) #D001
- 2025-09-28: 使用Vite作为构建工具，端口80，支持热重载 (related: #P002) #D002
- 2025-09-28: 集成Pinia作为状态管理工具替代Vuex #D003
- 2025-09-28: 采用Element Plus 2.4.3作为UI框架，支持中文本地化 #D004
- 2025-01-10: 订单管理页面简化为只读模式，移除新增/修改/删除功能，专注数据查询和展示 #D005
- 2025-01-10: 使用watch监听日期范围变化，实现自动查询提升用户体验 (related: #TODO005) #D006
- 2025-01-10: Git历史清理策略采用orphan分支重建，彻底移除敏感信息 (related: #SECURITY001) #D007

## 📝 TODO
<!-- 待办任务、计划功能、需要解决的问题 -->
- [P0] [IN-PROGRESS] [#TODO005] 解决Zeabur前端部署配置问题（登录405错误）(assignee: AI)
- [P1] [OPEN] [#TODO006] 测试订单页面日期筛选和字典数据展示功能
- [P1] [OPEN] [#TODO001] 项目依赖版本更新检查 (due: 2025-10-05)
- [P2] [OPEN] [#TODO002] 代码质量和ESLint配置完善
- [P2] [OPEN] [#TODO003] TypeScript迁移评估和规划
- [P1] [OPEN] [#TODO004] 移动端响应式适配优化

## ✅ Done
<!-- 已完成任务、解决的问题、达成的里程碑 -->
- 2025-09-28: [#INIT] 完成项目深度上下文分析和架构理解 (evidence: project.context.md创建)
- 2025-09-28: [#ANALYSIS] 识别项目为基于RuoYi的Vue3智能售货机管理系统
- 2025-09-28: [#FIX] 修正项目记忆文件中的日期错误，更新为正确的2025-09-28日期 (evidence: 文件更新)
- 2025-09-28: [#BUGFIX] 修复商品管理导出功能选中逻辑缺陷，支持按选中商品导出 (evidence: src/views/manage/sku/index.vue:442-472)
- 2025-09-28: [#UI-FIX] 修复设备管理页面货道按钮图标大小不一致问题，统一调整为20px并更新SCSS (evidence: src/views/manage/vm/index.vue, src/views/manage/vm/index.scss)
- 2025-09-28: [#UI-ANALYSIS] 定位货道图标与文字间距异常，确认由模板中的换行空白导致并给出内联写法/包裹元素的解决方案
- 2025-09-29: [#UX-ERROR] 统一删除/接口错误通知样式，避免重复弹窗并提供引导说明 (evidence: src/utils/errorHandler.js, src/utils/request.js)
- 2025-09-29: [#BUGFIX-VMTYPE] 为设备类型增删改接口启用自定义错误处理并补齐组件导入，消除重复提示 (evidence: src/api/manage/vmType.js, src/views/manage/vmType/index.vue)
- 2025-01-10: [#SECURITY001] 清理Git历史中的阿里云AccessKey泄露，使用orphan分支重建历史 (evidence: commit:6309daa, GitHub/Gitee强制推送成功)
- 2025-01-10: [#REFACTOR001] 重构订单管理页面，移除CRUD功能，保留查询和展示 (evidence: src/views/manage/order/index.vue)
- 2025-01-10: [#FEATURE001] 订单页面添加日期范围筛选器，使用Element Plus DatePicker (evidence: src/views/manage/order/index.vue:12-20)
- 2025-01-10: [#BUGFIX001] 修复日期选择器清空后仍保留旧查询条件的问题，优化watch监听逻辑 (evidence: src/views/manage/order/index.vue:82-95)
- 2025-01-10: [#OPTIMIZATION001] 移除订单页面重复的订单状态列，保留字典标签展示 (evidence: src/views/manage/order/index.vue:60-66)

## 🔍 Issues [***]
<!-- 问题解决记录，标记难度等级 -->
- 2025-09-28: [**] 商品导出功能逻辑缺陷 (solved: 修改handleExport函数，增加选中商品判断和用户确认机制)
- 2025-09-28: [**] 前端数组参数发送格式问题 (solved: 使用查询字符串方式发送多个同名参数)
- 2025-09-28: [***] MyBatis SQL参数缺失错误 (identified: selectBatchSkuBySkuId包含多余参数检查，需要创建专用selectSkuListByIds方法)
- 2025-01-10: [****] Git历史泄露阿里云AccessKey安全问题 (attempts:3, time:45min, solved:使用git orphan分支重建历史)
  - **问题描述**: GitHub Push Protection检测到7个commit中包含阿里云AccessKey，阻止推送
  - **尝试次数**: 3次（filter-branch尝试、BFG工具评估、orphan分支重建）
  - **根本原因**: application.yml中硬编码了access-key: LTAI5t65BPE3hBJZihbP2BiZ
  - **解决方法**: 
    1. 使用git checkout --orphan创建全新分支
    2. 提交所有当前文件（已改用环境变量）
    3. 强制替换master分支
    4. 强制推送到GitHub和Gitee
  - **经验教训**: 敏感信息必须使用环境变量，绝不硬编码
  - **预防措施**: 立即撤销泄露的密钥，重新生成新密钥
- 2025-01-10: [**] 订单页面日期选择器清空不生效 (attempts:2, time:25min, solved:修正watch监听逻辑)
  - **问题描述**: 清空日期范围或点击重置后，仍使用旧的日期条件查询
  - **尝试次数**: 2次（注释handleQuery、修正赋值逻辑）
  - **根本原因**: watch中直接赋值覆盖整个queryParams对象，丢失pageNum等属性
  - **解决方法**: 
    1. 只更新beginTime和endTime字段，不覆盖整个对象
    2. 清空时设置为null而不是删除属性
    3. 优化resetQuery顺序，先重置表单再清空日期
  - **经验教训**: 响应式对象更新时要保持其他属性不丢失
  - **预防措施**: 使用属性赋值而非对象覆盖

## 💡 Notes
<!-- 备注信息、临时想法、待确认事项 -->
- Needs-Confirmation: 是否需要添加TypeScript支持来提升代码质量
- Reference: RuoYi官方文档 http://doc.ruoyi.vip/
- Idea: 考虑集成PWA功能以提升移动端体验
- 2025-01-10: Zeabur部署配置问题 - 前端环境变量需要配置VITE_APP_BASE_API=https://dkd-backend-api.zeabur.app
- 2025-01-10: 后端数据库字典正常（order_status存在），前端需要等待字典加载完成后再渲染
- 2025-01-10: 订单页面已简化为纯查询功能，符合实际业务场景（订单不支持前端修改）

---

## 📊 项目技术栈深度分析

### 🎯 项目基本信息
- **项目名称**: 帝可得智能售货机管理系统
- **项目类型**: Vue3 + Element Plus 企业级管理系统
- **基础框架**: RuoYi-Vue 3.8.7
- **开发模式**: 前后端分离架构
- **业务领域**: 智能售货机运营管理平台

### 🏗️ 核心技术架构
**前端技术栈**:
- **框架**: Vue 3.4.0 (Composition API)
- **构建工具**: Vite 5.0.4 + ES模块
- **UI框架**: Element Plus 2.4.3 (中文本地化)
- **状态管理**: Pinia 2.1.7 (替代Vuex)
- **路由管理**: Vue Router 4.2.5
- **HTTP客户端**: Axios 0.27.2

**开发工具链**:
- **代码风格**: Sass 1.69.5 + SCSS模块化
- **图标系统**: SVG Icons + Element Plus Icons
- **自动导入**: unplugin-auto-import 0.17.1
- **组件扩展**: unplugin-vue-setup-extend-plus

### 🎨 UI/UX 设计特点
- **设计系统**: 基于Element Plus的企业级设计规范
- **布局模式**: 左侧导航 + 顶部导航的经典后台布局
- **主题系统**: 支持亮色/暗色主题切换
- **响应式**: 支持多尺寸屏幕适配
- **图标系统**: SVG图标 + 阿里巴巴图标库集成

### 📦 核心业务模块
**管理功能模块**:
- **设备管理**: 售货机节点、状态、类型管理
- **商品管理**: SKU、商品类型、商品政策
- **合作伙伴**: 渠道伙伴、区域管理
- **人员管理**: 员工、角色权限管理

**系统功能模块**:
- **系统管理**: 用户、角色、权限、字典管理
- **监控中心**: 在线用户、登录日志、操作日志
- **系统工具**: 代码生成、系统接口、定时任务

### 🔧 开发配置分析
**Vite配置特点**:
- **开发服务器**: 端口80，支持热重载和自动打开
- **代理配置**: /dev-api 代理到 127.0.0.1:8080
- **路径别名**: @ 指向 src 目录，~ 指向根目录
- **CSS处理**: 支持SCSS，解决@charset警告问题

**插件生态**:
- **SVG处理**: vite-plugin-svg-icons
- **代码压缩**: vite-plugin-compression
- **自动导入**: 减少重复import代码
- **组件扩展**: 支持setup语法扩展

### 🚀 性能优化特点
- **按需加载**: 路由级别的代码分割
- **组件复用**: 高度封装的通用组件
- **状态管理**: Pinia轻量级状态管理
- **图标优化**: SVG图标系统，支持tree-shaking
- **构建优化**: Vite快速构建和热重载

### 📱 业务特点分析
**智能售货机业务核心**:
- **B端管理**: 设备运营、商品管理、数据分析
- **运维支持**: 故障处理、补货管理、收益统计
- **合作模式**: 自营、加盟、点位分成多种模式
- **支付集成**: 支持支付宝、微信、银联等多种支付方式

### 🎯 项目优势
1. **成熟框架**: 基于RuoYi生态，开发效率高
2. **现代技术**: Vue3 + Vite + Pinia 现代化技术栈
3. **完整功能**: RBAC权限、系统监控、代码生成等完整功能
4. **易于维护**: 良好的代码组织和组件化设计
5. **企业级**: 符合企业级应用的安全和性能要求

### 📈 改进建议
1. **TypeScript**: 考虑引入TypeScript提升代码质量
2. **单元测试**: 添加Jest/Vitest测试框架
3. **移动适配**: 进一步优化移动端响应式体验
4. **PWA**: 考虑添加PWA功能提升用户体验
5. **性能监控**: 集成性能监控和错误追踪

### 🔒 安全特性
- **权限控制**: 基于RBAC的细粒度权限管理
- **登录安全**: 支持验证码、记住密码等安全功能
- **数据加密**: jsencrypt RSA加密支持
- **CSRF防护**: 基于Token的CSRF防护机制
