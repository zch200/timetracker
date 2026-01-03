# TimeTracker - 项目规则文档

## 项目概述

**TimeTracker** 是一款 macOS 原生时间记录与分析工具，旨在替代 Excel 表格，为个人提供**极简、丝滑、高效**的时间管理解决方案。

### 核心价值主张
- **记录优先**：以最低摩擦力完成时间段录入（3 秒录入法则）
- **本地至上**：数据完全存储在本地，无需服务器或云同步
- **深度分析**：通过可视化图表洞察时间分配规律，优化个人效能

---

## 技术栈

### 前端框架
- **运行时**：Electron（macOS 客户端）
- **UI 框架**：React 18 + TypeScript
- **构建工具**：electron-vite（基于 Vite 的 Electron 脚手架）
- **样式方案**：Tailwind CSS
- **组件库**：shadcn/ui（基于 Radix UI）

### 数据层
- **数据库**：better-sqlite3（同步 API，性能优于异步版本）
- **数据持久化**：本地 SQLite 文件存储（位于用户文档目录）

### 功能库
- **图表可视化**：Recharts（与 shadcn/ui 生态兼容）
- **Excel 处理**：exceljs（支持 .xlsx 导入导出）
- **状态管理**：Zustand（轻量级状态管理）
- **日期处理**：date-fns（轻量且 Tree-shakable）

### 开发工具
- **代码规范**：ESLint + Prettier
- **类型检查**：TypeScript 5.x
- **包管理器**：pnpm（推荐）

---

## 项目结构规范

```
timetable/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 主进程入口
│   │   ├── database.ts    # SQLite 数据库封装
│   │   └── ipc.ts         # IPC 通信处理
│   ├── renderer/          # React 渲染进程
│   │   ├── App.tsx        # 应用根组件
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── store/         # Zustand 状态管理
│   │   ├── lib/           # 工具函数
│   │   └── styles/        # 全局样式（Tailwind 配置）
│   └── preload/           # 预加载脚本
├── docs/                  # 项目文档
│   ├── blueprint.md       # 项目蓝图
│   └── requirements/      # 需求文档
├── resources/             # 应用资源（图标、配置等）
├── CLAUDE.md              # 本文件
└── package.json
```

---

## 开发原则

### 1. 极简主义设计
- **功能克制**：只做时间记录与分析的核心功能，拒绝功能堆砌
- **交互简化**：录入流程不超过 3 步，支持键盘操作无需鼠标
- **视觉干净**：界面信息密度低，减少认知负荷

### 2. 性能优先
- **启动速度**：冷启动控制在 2 秒内（Electron 固有成本）
- **响应速度**：所有数据库查询控制在 100ms 内
- **渲染优化**：列表虚拟滚动（处理大数据量）

### 3. 数据安全
- **本地存储**：数据库文件存储在 `~/Library/Application Support/TimeTracker/`
- **备份机制**：支持手动导出 Excel 作为备份
- **数据校验**：录入时进行时间段冲突检测

### 4. AI 开发友好
- **代码规范**：遵循主流最佳实践，注释清晰
- **模块解耦**：业务逻辑与 UI 分离，便于迭代
- **类型安全**：充分利用 TypeScript 类型系统

---

## 核心约束

### 数据规模预估
- **历史数据**：2019 年至今约 6.6 万条记录
- **增长速度**：每年约 1.3 万条（330 天 × 40 条/天）
- **性能目标**：支持 10 年数据量（约 13 万条）仍保持流畅

### 录入场景特征
- **高频操作**：每天录入 30-50 个时间段
- **实时 + 补录**：60% 实时记录，40% 事后补录（几小时内）
- **关键指标**：单次录入耗时 < 5 秒（含思考时间）

### 分析需求维度
- **时间维度**：按日/周/月/年聚合统计
- **分类维度**：按事项分类（工作/生活/学习等）统计
- **事项维度**：单个事项的时长趋势分析
- **可视化**：时长柱状图、趋势曲线图、分类占比饼图

---

## 注意事项

### 技术债务管理
- **避免过度抽象**：优先实现功能，重构放在第二阶段
- **依赖管理**：定期更新依赖以修复安全漏洞
- **测试策略**：MVP 阶段手动测试为主，后续补充单元测试

### macOS 适配
- **窗口管理**：支持最小化到菜单栏（Tray）
- **快捷键**：避免与系统快捷键冲突
- **沙箱权限**：正确配置文件访问权限（entitlements）

### 数据迁移
- **Excel 导入**：需兼容现有 [timetable.xlsx](timetable.xlsx) 的数据结构
- **版本升级**：预留数据库 schema 版本号，便于未来迁移

---

## 参考资料

- [Electron 官方文档](https://www.electronjs.org/docs/latest)
- [electron-vite](https://electron-vite.org/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Recharts 文档](https://recharts.org/)

---

**文档版本**：v1.0
**最后更新**：2026-01-02
**维护者**：lok666