# Hi！HTML - Netlify 部署指南

## 介绍

这是一个针对 Netlify 平台优化的 HTML 代码分享站。通过 Netlify 的无服务器函数 (Functions)，我们可以实现服务器端存储 HTML 内容，同时避免 Cloudflare 的 Error 1019 问题。

## 优势

与纯静态版本相比，Netlify 版本有以下优势：

1. **服务器端存储** - HTML 内容保存在服务器上，不依赖本地浏览器存储
2. **跨设备访问** - 生成的链接可以在任何设备上访问
3. **较长的保存时间** - 内容默认保存 7 天
4. **更可靠的服务** - Netlify 提供稳定的无服务器函数环境

## 部署步骤

### 方法一：通过 GitHub 部署（推荐）

这是最简单的方法，也是最推荐的方式：

1. **创建 GitHub 仓库**:
   ```bash
   git init
   git add .
   git commit -m "初始提交"
   git remote add origin https://github.com/您的用户名/hi-html.git
   git push -u origin main
   ```

2. **在 Netlify 上部署**:
   - 注册/登录 [Netlify](https://app.netlify.com/)
   - 点击 "New site from Git"
   - 选择 GitHub，授权并选择您的仓库
   - 配置构建设置：
     - 构建命令：`npm run build`
     - 发布目录：`dist`
   - 点击 "Deploy site"

### 方法二：使用 Netlify CLI

如果您更喜欢命令行方式：

1. **安装 Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **登录 Netlify**:
   ```bash
   netlify login
   ```

3. **初始化网站**:
   ```bash
   netlify init
   ```
   按照提示进行配置

4. **部署网站**:
   ```bash
   npm run build
   netlify deploy --prod
   ```

### 方法三：直接上传（简易方法）

1. **构建项目**:
   ```bash
   npm run build
   ```

2. **手动上传**:
   - 注册/登录 [Netlify](https://app.netlify.com/)
   - 点击 "New site from upload"
   - 拖放 `dist` 目录或点击选择
   - 点击 "Deploy site"

   注意：这种方法无法使用持续部署功能，每次更新都需要手动上传。

## 自定义域名（可选）

1. 在 Netlify 网站设置中找到 "Domain settings"
2. 点击 "Add custom domain"
3. 输入您的域名，按照步骤进行配置
4. 通过添加 DNS 记录完成域名连接

## 高级功能配置

### 更改内容保存时间

默认内容保存 7 天。如果需要更改，请修改 `netlify/functions/upload.js` 中的以下行：

```js
// 设置过期时间(7天)，防止内存泄漏
setTimeout(() => {
  delete contentStore[fileId];
}, 7 * 24 * 60 * 60 * 1000); // 可以修改为其他时长
```

### 使用持久化存储

当前实现使用内存存储，这意味着应用重启后数据会丢失。如需长期存储，推荐使用 FaunaDB 或 Netlify KV：

1. **创建 FaunaDB 数据库**:
   - 注册 [FaunaDB](https://fauna.com/)
   - 创建新数据库
   - 创建适当的集合和索引

2. **更新函数代码**:
   - 安装 FaunaDB 客户端：`npm install faunadb`
   - 修改 `upload.js` 和 `getContent.js` 使用 FaunaDB 

### 启用本地开发环境

如需在本地测试和开发：

```bash
# 安装依赖
npm install

# 启动本地开发服务器
netlify dev
```

## 故障排除

1. **函数未被调用**: 确认 `netlify.toml` 重定向配置正确
2. **API 返回 404**: 检查函数名称和目录结构
3. **部署问题**: 查看 Netlify 部署日志

## 资源链接

- [Netlify 文档](https://docs.netlify.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [FaunaDB 文档](https://docs.fauna.com/) 