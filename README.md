# 内容作战台 · CONTENT OPS CONSOLE

泛自媒体博主用的运营工作台 —— 单文件、纯前端、可离线、手机电脑都能用。
把「选题 → 脚本 → 发布 → 复盘」主循环做成五个板块：

- **今日**：灵感速记（一键转选题）、今日待办（逾期 / 待补录数据智能提醒）、连更里程碑徽章、每日激励语
- **选题**：每周选题会 4 步、爆款 / 日常 / 系列 / 测试四类选题库、本周配比进度、爆款雷达（自动聚合金句钩子 / 平台 / 赛道洞察）
- **脚本**：黄金 3 秒开头公式库、视频 / 图文爆款结构模板、AI 指令生成器（一键产出可复制的专家级 prompt）、我的资产库（搜索 / 星级 / 复制）
- **发布**：各平台最佳发布时段、发布排期（逾期红标、改期 / 删除 / 标已发）、发布后黄金 1 小时清单
- **复盘**：四率看板（视频看完播、图文看收藏，按形态自动切换）、曝光 × 涨粉双轴趋势、归因分析（按选题 / 钩子 / 时段 / 形态 / 平台切换）、每条内容自动判定「爆了 / 达标 / 低于预期」

## 本地使用

直接双击 `index.html`（或 `内容作战台.html`）用浏览器打开即可，无需服务器、无需联网。

## 数据存储

- **主存：浏览器 `localStorage`**，改动自动保存（防抖写入）。
- **备份 / 迁移**：数据菜单（`◈ DATA`）支持 **JSON 备份导出 / 导入**，以及选题库 / 排期 / 复盘 **CSV 导出**。
- **跨设备云同步（可选）**：见下方「跨设备云同步」章节。数据用「同步口令」在浏览器端做 AES-GCM 加密，**明文不出本机**，云端（Cloudflare KV）只存密文。

## 跨设备云同步（Cloudflare Worker + KV）

> 设计原则：**零知识**。前端用口令做 PBKDF2 → AES-GCM 加密，Worker 只负责存取密文，无法读取你的内容。换设备 / 换浏览器，输入同一「同步口令」即可恢复。

### 1) 部署同步后端（一次性）

需要 Cloudflare 账号（Account ID + 有 Workers/KV 权限的 API Token）。

```bash
# 安装 wrangler（Node 22）
npm install -g wrangler
wrangler login            # 或 wrangler config 填 Token

cd worker
wrangler kv namespace create SYNC_KV     # 复制输出的 id
# 把 id 填进 worker/wrangler.toml 的 id 字段
wrangler deploy                          # 得到 https://content-ops-sync.<sub>.workers.dev
```

Worker 地址即为 `https://<你的子域>.workers.dev/sync`。

### 2) 应用内启用

打开数据菜单 `◈ DATA` → 底部「跨设备云同步 · Cloudflare」：
1. 填入上面的 **Worker 地址**（如 `https://xxx.workers.dev/sync`）；
2. 设一个 **同步口令**（本地保存，用于加密；多端必须一致）；
3. 点 **▲ 推送** 上传，或开 **自动同步**（改动即上传）；另一台设备填入相同地址+口令后点 **▼ 拉取** 即可。

> 同步为「最后写入覆盖」（last-write-wins），适合单人多端使用。本地 `localStorage` 仍是主存，云同步是增量镜像。

## 部署（纯静态）

可直接托管到任意静态托管（Cloudflare Pages / GitHub Pages / Vercel 等）。
Cloudflare Pages 默认入口为 `index.html`，本仓库已提供该入口文件。

## 主题

右上角按钮在 **暗色 / 亮色 / 自动（跟随系统）** 三态间切换，偏好存入 `localStorage`。

## 源码结构

`build/` 下 `d1~d5.html` 为分片开发源，合并命令：

```bash
cat build/d1.html build/d2.html build/d3.html build/d4.html build/d5.html > 内容作战台.html
cp 内容作战台.html index.html   # 供静态托管作为入口
```

> 所有 CSS / JS / 资源均内联，无外部 CDN、无外部字体，图表全部手写 SVG。
