# Vercel Edge CORS Proxy

在 Vercel Edge Runtime 上运行的轻量代理，统一返回 `Access-Control-Allow-Origin: *`.

## 使用方式

```
/api/proxy?url=<目标接口>
```

示例：
```
/api/proxy?url=https://api.example.com/data
```

支持：
- GET/POST/PUT/PATCH/DELETE
- OPTIONS 预检（204）
- 透传后端状态码与响应体
- CORS 头：`Access-Control-Allow-Origin: *`

## 前端示例
```ts
const url = encodeURIComponent('https://api.example.com/data')
const resp = await fetch(`/api/proxy?url=${url}`, {

})
const data = await resp.json()
console.log(data)
```

## 开发与部署
```bash
pnpm install   # 或 npm/yarn
pnpm dev
pnpm build
```

将仓库连接到 Vercel 或在 Vercel 导入该 GitHub 仓库即可自动部署。
