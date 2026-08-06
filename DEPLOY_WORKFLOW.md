# Reader 项目部署工作流（标准操作手册）

> 创建时间：2026-08-06
> 用途：规范从代码修改 → GitHub推送 → 构建 → 下载镜像的完整流程

---

## 一、Git 推送规范

### 1. 推送前检查
```bash
cd /e/reader-master
git status              # 确认修改文件
git diff --stat         # 查看变更概要
git log --oneline -3    # 确认最新提交
```

### 2. 提交代码
```bash
git add <修改的文件>
git commit -m "fix: 描述 (#编号)"
git push origin master
```

**注意**：使用 SSH 推送（`git@github.com:0320whq/reader.git`），不要硬编码 token 在 remote URL 中。

### 3. 验证同步
```bash
git ls-remote --heads origin    # 检查远程分支
git log origin/master..master --oneline   # 确认无未推送提交
```

---

## 二、GitHub Actions 构建触发

### 1. 打标签触发构建
Build Custom Reader Image 工作流由 tag 触发：
```bash
git tag custom-vXX              # XX 为版本号，如 v10
git push origin custom-vXX
```

**触发条件**：`.github/workflows/build-custom.yml` 中 `on.push.tags: 'custom-**'`

### 2. 构建状态检查
```bash
# 查看最新运行状态（API方式）
curl -s https://api.github.com/repos/0320whq/reader/actions/runs?per_page=3 | grep -E "run_number|status|conclusion|head_sha"

# 或访问网页
https://github.com/0320whq/reader/actions
```

### 3. 构建成功标志
- status: `completed`
- conclusion: `success`
- head_sha 与本地 commit 一致

---

## 三、标签清理

### 1. 查看远程标签
```bash
git ls-remote --tags origin
```

### 2. 删除旧 custom 标签（只保留最新）
```bash
# 删除所有旧 custom 标签
git push origin --delete refs/tags/custom-v4 refs/tags/custom-v6 refs/tags/custom-v8 refs/tags/custom-v9

# 保留最新 custom-v10
```

**注意**：保留历史版本标签（v1.x.x），只删除旧的 custom-* 构建标签。

---

## 四、Artifact 下载

### 1. 获取 Artifact 信息
```bash
curl -s https://api.github.com/repos/0320whq/reader/actions/runs/<run_id>/artifacts
```

返回字段：
- `archive_download_url` — 下载链接
- `size_in_bytes` — 文件大小（约 107MB）
- `expires_at` — 过期时间（默认 7 天）

### 2. 下载命令
```bash
curl -L -H "Authorization: token <GITHUB_TOKEN>" \
     -H "Accept: application/vnd.github+json" \
     "https://api.github.com/repos/0320whq/reader/actions/artifacts/<artifact_id>/zip" \
     -o E:/reader-master/reader-custom-vXX-artifact.zip
```

**注意**：
- 下载的是 ZIP 格式，内部包含 tar.gz
- 网络不稳定时增加 `--max-time 300`
- 文件约 102MB，需要耐心等待

### 3. 解压使用
```bash
# 解压 artifact zip
unzip reader-custom-vXX-artifact.zip

# 得到 reader-custom.tar.gz，导入 Docker
docker load -i reader-custom.tar.gz
```

---

## 五、Docker 部署命令（极空间 NAS）

```bash
docker run -d --restart=unless-stopped \
    --name reader \
    -p 6666:8080 \
    -v /volume1/docker/reader/logs:/logs \
    -v /volume1/docker/reader/storage:/storage \
    -e SPRING_PROFILES_ACTIVE=prod \
    reader-custom:latest
```

---

## 六、环境变量与目录映射

| 映射项 | 宿主机路径 | 容器内路径 | 说明 |
|--------|-----------|-----------|------|
| 日志 | /volume1/docker/reader/logs | /logs | 运行日志 |
| 数据 | /volume1/docker/reader/storage | /storage | 书籍数据、用户配置 |
| 端口 | 6666 | 8080 | 访问端口 |

---

## 七、故障排查

### 1. 推送失败（HTTPS 超时）
**原因**：网络不稳定或 token 过期
**解决**：改用 SSH 推送
```bash
git remote set-url origin git@github.com:0320whq/reader.git
```

### 2. Actions 构建失败
**常见原因**：
- ESLint `no-unused-vars` 错误 → 删除未使用的 import
- Node 版本不兼容 → workflow 中指定 `node-version: '18'`
- Kotlin `continue` 在 forEach 中非法 → 改用 `return@forEach`

**排查方式**：
```bash
# 下载构建日志
curl -L -H "Authorization: token <TOKEN>" \
     "https://api.github.com/repos/0320whq/reader/actions/runs/<run_id>/logs" \
     -o logs.zip
```

### 3. Artifact 下载超时
**解决**：增加超时时间，或使用浏览器手动下载
```bash
curl --max-time 300 ...
```

---

## 八、安全注意事项

1. **不要硬编码 GitHub Token** 到 git remote URL 或代码中
2. **SSH 密钥** 存放在 `~/.ssh/id_ed25519`，不要泄露
3. **旧 token 已泄露**：已写入历史提交，建议 GitHub 后台撤销并重新生成（不要在代码或文档中存放 token，统一用环境变量 `GITHUB_TOKEN`）

---

## 九、版本记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-08-06 | custom-v10 | 完成全部 7 轮 bug 修复（37处）+ 部署流程标准化 |

---

**执行优先级**：修改代码 → 提交 → push master → 打 custom 标签 → 等待构建成功 → 下载 artifact → 清理旧标签
