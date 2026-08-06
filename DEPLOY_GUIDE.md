# reader 极空间NAS Docker部署指南

> **版本**: custom-v4 (Run #31)
> **构建时间**: 2026-08-05
> **镜像大小**: 103MB (tar.gz)
> **修复数量**: 34处bug修复
> **适用设备**: 极空间Z4Pro (x86架构)

---

## 一、准备工作

### 1.1 确认文件位置

确保 `reader-custom.tar.gz` 已上传到极空间NAS的以下路径之一：

| 推荐路径 | 说明 |
|----------|------|
| `/volume1/docker/reader/reader-custom.tar.gz` | 最佳，与数据目录同级 |
| `/volume1/shared/reader-custom.tar.gz` | 共享文件夹，方便上传 |

### 1.2 确认NAS网络

确保极空间NAS满足以下条件：
- [ ] SSH已开启（系统设置 → 服务 → SSH）
- [ ] 可通过SSH登录（用户名：root，密码：你的极空间管理密码）
- [ ] 端口8080未被占用（或被其他Docker容器占用时可换端口）

---

## 二、快速部署（推荐）

### 2.1 SSH登录极空间

```bash
# Windows PowerShell / Git Bash
ssh root@<你的极空间IP地址>
# 例如：ssh root@192.168.1.100

# 输入密码（极空间管理密码）
```

### 2.2 一键部署脚本

登录后执行以下命令：

```bash
# 进入镜像所在目录
cd /volume1/docker/reader

# 1. 停止并删除旧容器（如果有）
docker stop reader 2>/dev/null || true
docker rm reader 2>/dev/null || true

# 2. 加载新镜像
docker load < reader-custom.tar.gz

# 3. 启动新容器
docker run -d \
  --name reader \
  -p 6666:8080 \
  -v /volume1/docker/reader/logs:/logs \
  -v /volume1/docker/reader/storage:/storage \
  -e SPRING_PROFILES_ACTIVE=prod \
  --restart unless-stopped \
  reader-custom:latest

# 4. 查看启动日志（等待"Server started"）
docker logs -f reader
```

**预期输出**：
```
Server started at port 8080
```

看到该行后按 `Ctrl+C` 退出日志查看，容器已在后台运行。

### 2.3 访问阅读页面

在浏览器打开：
```
http://<你的极空间IP>:6666
# 例如：http://192.168.1.100:6666
```

---

## 三、分步详解（适合首次部署）

### 3.1 创建目录结构

```bash
# 创建持久化数据目录
mkdir -p /volume1/docker/reader/logs
mkdir -p /volume1/docker/reader/storage

# 确认目录存在
ls -la /volume1/docker/reader/
```

### 3.2 停止旧容器（升级场景）

```bash
# 查看运行中的reader容器
docker ps | grep reader

# 停止并删除旧容器（保留数据）
docker stop reader
docker rm reader

# 可选：删除旧镜像释放空间
docker images | grep reader
docker rmi <旧镜像ID>
```

### 3.3 加载镜像

```bash
cd /volume1/docker/reader

# 加载镜像（约30-60秒）
docker load < reader-custom.tar.gz

# 验证镜像已加载
docker images | grep reader-custom
# 应显示：reader-custom  latest  <镜像ID>  ...  约400MB
```

### 3.4 启动容器

```bash
docker run -d \
  --name reader \
  -p 6666:8080 \
  -v /volume1/docker/reader/logs:/logs \
  -v /volume1/docker/reader/storage:/storage \
  -e SPRING_PROFILES_ACTIVE=prod \
  --restart unless-stopped \
  reader-custom:latest
```

**参数说明**：

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `--name reader` | 容器名称 |
| `-p 6666:8080` | 主机6666端口映射到容器8080端口 |
| `-v /volume1/docker/reader/logs:/logs` | 日志持久化 |
| `-v /volume1/docker/reader/storage:/storage` | 书籍数据持久化 |
| `-e SPRING_PROFILES_ACTIVE=prod` | 生产环境配置 |
| `--restart unless-stopped` | 除非手动停止，否则自动重启 |

### 3.5 验证启动

```bash
# 查看容器状态
docker ps | grep reader
# 应显示：up (healthy) 或 up

# 查看实时日志
docker logs -f reader

# 检查端口监听
curl -s http://localhost:6666 | head -5
```

---

## 四、常见问题

### 4.1 端口冲突

如果6666端口被占用：
```bash
# 更换为其他端口，例如 7777
docker run -d \
  --name reader \
  -p 7777:8080 \
  -v /volume1/docker/reader/logs:/logs \
  -v /volume1/docker/reader/storage:/storage \
  -e SPRING_PROFILES_ACTIVE=prod \
  --restart unless-stopped \
  reader-custom:latest
```

### 4.2 容器启动失败

```bash
# 查看错误日志
docker logs reader

# 常见原因：
# 1. 权限不足 → 检查目录权限 chmod 755 /volume1/docker/reader
# 2. 内存不足 → 确保NAS剩余内存 > 512MB
# 3. 端口占用 → netstat -tlnp | grep 6666
```

### 4.3 数据备份

```bash
# 备份书籍数据
tar -czf /volume1/docker/reader-backup-$(date +%Y%m%d).tar.gz \
  /volume1/docker/reader/storage

# 备份日志
tar -czf /volume1/docker/reader-logs-backup-$(date +%Y%m%d).tar.gz \
  /volume1/docker/reader/logs
```

### 4.4 回滚旧版本

```bash
# 停止当前容器
docker stop reader
docker rm reader

# 加载旧版本镜像（如有备份）
docker load < reader-custom-old.tar.gz

# 启动旧版本
docker run -d \
  --name reader \
  -p 6666:8080 \
  -v /volume1/docker/reader/logs:/logs \
  -v /volume1/docker/reader/storage:/storage \
  -e SPRING_PROFILES_ACTIVE=prod \
  --restart unless-stopped \
  reader-custom:latest
```

---

## 五、自动化脚本（保存为 deploy.sh）

```bash
#!/bin/bash
set -e

# 配置
IMAGE_FILE="/volume1/docker/reader/reader-custom.tar.gz"
CONTAINER_NAME="reader"
HOST_PORT="6666"
CONTAINER_PORT="8080"
LOG_DIR="/volume1/docker/reader/logs"
STORAGE_DIR="/volume1/docker/reader/storage"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Reader Docker 部署脚本 ===${NC}"

# 检查镜像文件
if [ ! -f "$IMAGE_FILE" ]; then
    echo -e "${RED}错误：镜像文件不存在: $IMAGE_FILE${NC}"
    exit 1
fi

# 创建数据目录
mkdir -p "$LOG_DIR" "$STORAGE_DIR"

# 停止旧容器
echo -e "${YELLOW}[1/4] 停止旧容器...${NC}"
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# 加载镜像
echo -e "${YELLOW}[2/4] 加载镜像...${NC}"
docker load < "$IMAGE_FILE"

# 启动容器
echo -e "${YELLOW}[3/4] 启动新容器...${NC}"
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  -v "${LOG_DIR}:/logs" \
  -v "${STORAGE_DIR}:/storage" \
  -e SPRING_PROFILES_ACTIVE=prod \
  --restart unless-stopped \
  reader-custom:latest

# 等待启动
echo -e "${YELLOW}[4/4] 等待服务启动...${NC}"
sleep 10

# 验证
echo -e "${GREEN}容器状态：${NC}"
docker ps | grep "$CONTAINER_NAME"

echo -e "${GREEN}访问地址：http://$(hostname -I | awk '{print $1}'):${HOST_PORT}${NC}"
echo -e "${GREEN}日志查看：docker logs -f ${CONTAINER_NAME}${NC}"
```

**使用方法**：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 六、部署验证清单

部署完成后，逐一确认：

- [ ] 浏览器访问 `http://<IP>:6666` 正常打开
- [ ] 页面加载不卡顿（5秒内完成）
- [ ] 添加书籍后刷新页面，设置不丢失
- [ ] 关闭浏览器重新打开，书架数据仍在
- [ ] 连续使用30分钟无后端断开
- [ ] 日志无异常报错：`docker logs reader | grep -i error`

---

## 七、技术支持

如遇问题：
1. 查看容器日志：`docker logs reader`
2. 检查NAS资源：`docker stats reader`
3. 重启容器：`docker restart reader`
4. 完全重置：`docker rm -f reader` 后重新部署

> **注意**：此版本包含34处bug修复（安全、功能、性能），强烈建议升级。
