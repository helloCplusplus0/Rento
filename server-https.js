const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3002

// 创建Next.js应用
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// SSL证书配置
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs/server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/server.crt')),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
  .once('error', (err) => {
    console.error(err)
    process.exit(1)
  })
  .listen(port, () => {
    console.log(`\n🎉 HTTPS服务器启动成功!`)
    console.log(`📱 本地访问: https://localhost:${port}`)
    console.log(`🌐 局域网访问: https://192.168.31.84:${port}`)
    console.log(`\n📋 测试步骤:`)
    console.log(`1. 在浏览器访问上述地址`)
    console.log(`2. 接受自签名证书警告`)
    console.log(`3. 测试应用功能`)
    console.log(`\n⚠️  注意: 首次访问需要接受自签名SSL证书警告`)
  })
})