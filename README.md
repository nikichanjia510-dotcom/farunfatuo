# 托宝｜法润托育 · 智护成长

“托宝”是一个面向家长陪同使用的托育法治早教答辩展示产品。它把三个亲子安全关卡、双模式科普助手、浏览器语音、匿名试用反馈和来源说明放在一个可本地、可容器化运行的响应式网站中。

> 本产品用于《中华人民共和国托育服务法（草案）》公益科普，不构成个案法律意见、医疗诊断或正式政策解释。0—3 岁婴幼儿须由家长或可信照护者全程陪同。

## 已实现能力

- 三个无倒计时、无失败惩罚的亲子关卡：安全环境、身体边界、可信求助。
- 儿童陪伴与家长咨询双模式助手；本地审核知识优先，可选 OpenAI 兼容模型增强。
- 浏览器语音识别与语音合成；应用不保存录音，能力不可用时自动保留文字输入。
- 匿名记录关卡结果和试用反馈；聊天正文、录音、姓名、联系方式和健康记录不落库。
- 带官方来源、草案状态和更新时间的内容页。
- 管理令牌保护的匿名反馈 CSV 导出。
- 手机、平板、桌面与答辩投影响应式适配，高对比度和减少动画设置。
- 本地开发与 Docker Compose 一键运行。

## 快速开始

环境要求：Node.js 24、pnpm 11。

```bash
pnpm install
pnpm dev
```

开发模式：

- 网页：<http://127.0.0.1:5173>
- API：<http://127.0.0.1:3000>

复制 `.env.example` 为 `.env` 后可配置管理令牌和外部 AI：

```dotenv
ADMIN_TOKEN=请换成随机长令牌
AI_BASE_URL=https://your-provider.example/v1
AI_API_KEY=your-secret-key
AI_MODEL=your-model
```

不填写三个 `AI_*` 变量时，助手完整使用本地审核知识库，全部答辩流程仍可运行。

## Docker 运行

```bash
docker compose up --build
```

打开 <http://127.0.0.1:3000>。SQLite 数据保存在 Docker 命名卷 `tuobao_data` 中。

正式部署前必须通过环境变量修改默认 `ADMIN_TOKEN`。

## 免费静态发布

面向公开演示时可只发布网页，不运行 API 或数据库：

```bash
pnpm build:static
```

构建产物位于 `apps/web/dist`。静态版本会把已审核关卡和知识库打包进网页，托宝助手离线检索本地知识；游戏记录和匿名反馈只保存在访客自己的浏览器中，无法跨设备汇总。

推荐将 GitHub 仓库连接到 EdgeOne Makers，构建命令使用 `pnpm build:static`，输出目录使用 `apps/web/dist`。生产分支设置为 `main` 后，每次推送会自动构建并更新同一网址。

## 质量检查

```bash
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

`pnpm lint` 在本项目中执行所有工作区的严格 TypeScript 类型检查。端到端测试覆盖完整通关、知识库问答、匿名反馈和手机横向溢出检查。

## 内容与素材替换

- 审核知识：`content/knowledge-base.json`
- 游戏关卡：`content/game-levels.json`
- 内容 Schema：`content/schema/`
- 托宝占位素材：`apps/web/public/assets/tuobao/`

只有 `reviewStatus: "approved"` 的内容会进入公开 API。修改内容后应执行测试，并按 [内容审核清单](docs/content-review-checklist.md) 复核。

当前 SVG 是中性占位形象，不是最终托宝 IP。正式 IP、动画封面和视频的推荐规格见素材目录的 `asset-manifest.json` 和 `README.md`。

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 服务、数据库与内容版本健康检查 |
| GET | `/api/content/bootstrap` | 已审核关卡、知识、来源与功能开关 |
| POST | `/api/assistant/chat` | 本地知识优先的双模式问答 |
| POST | `/api/game-results` | 保存匿名关卡结果 |
| POST | `/api/feedback` | 保存匿名试用反馈 |
| GET | `/api/admin/feedback.csv` | Bearer 管理令牌导出反馈 CSV |

接口不接受儿童身份字段；聊天和反馈中出现明显手机号、邮箱或身份证号会被拒绝。

## 文档

- [系统架构](docs/architecture.md)
- [部署说明](docs/deployment.md)
- [内容审核清单](docs/content-review-checklist.md)
- [答辩演示脚本](docs/demo-script.md)

本仓库在开发阶段按私有项目管理，未附开源许可证。
