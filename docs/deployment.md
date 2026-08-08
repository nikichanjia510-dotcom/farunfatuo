# 部署说明

## 本机答辩

推荐使用 Docker，避免答辩电脑的 Node 版本差异：

```bash
docker compose up --build
```

浏览器访问 `http://127.0.0.1:3000`，并提前完成以下检查：

1. `/api/health` 返回 `status: ok`。
2. 不配置外部 AI 时，草案状态问题仍能正常回答。
3. 依次完成三个关卡并提交一份匿名反馈。
4. 使用配置的 `ADMIN_TOKEN` 导出 CSV。
5. 浏览器禁用麦克风后，文字输入仍可用。

## Linux 服务器

安装 Docker Engine 和 Compose 插件，拉取私有仓库后在服务器设置环境变量：

```bash
export ADMIN_TOKEN='高强度随机令牌'
export AI_BASE_URL='https://provider.example/v1'
export AI_API_KEY='密钥'
export AI_MODEL='模型名'
docker compose up -d --build
```

在容器前配置 HTTPS 反向代理。不要在代码、镜像或 Gitee CI 日志中写入密钥。

## 数据备份

匿名数据位于 `tuobao_data` 卷。升级前先备份该卷；展示结束后如需删除数据，应由项目负责人确认后再执行。

## 上线边界

- 当前内容为草案科普，正式公开前由法治内容组复核。
- 正式托宝 IP、院徽、团徽和动画须确认使用授权。
- 若面向真实家庭长期运营，需要补充隐私政策、数据保留期限、投诉渠道、安全评估和运维监控。
