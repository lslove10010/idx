const fs = require('fs');
const { chmodSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// cloudflared 文件路径
const cfPath = path.join(__dirname, 'cloudflared');

// 检查 cloudflared 是否存在
if (existsSync(cfPath)) {
    console.log('cloudflared 已存在，跳过下载。');
    runWithPM2();
} else {
    // 用 curl 下载 cloudflared
    console.log('开始用 curl 下载 cloudflared...');
    const downloadUrl = 'https://github.com/cloudflare/cloudflared/releases/download/2025.4.2/cloudflared-linux-amd64';
    try {
        execSync(`curl -L -o cloudflared "${downloadUrl}"`, { stdio: 'inherit' });
        chmodSync(cfPath, 0o755);
        console.log('cloudflared 下载并赋权完成。');
        runWithPM2();
    } catch (e) {
        console.error('curl 下载 cloudflared 出错：', e);
        process.exit(1);
    }
}

// 使用 pm2 运行 cloudflared（推荐shell模式）
function runWithPM2() {
    // 替换为你的 token
    const token = 'eyJhIjoiZDZlNGIzNDY3N2MzNjljOTViODM3YTcxNWFjZWNjYzciLCJ0IjoiMzdlOGNiZTAtNjg5NC00MTQ5LWJjZjktMjZhNDU1YmIxYzhjIiwicyI6IlpHRTRaRFppWVRNdFpHSTNaUzAwWTJZM0xUbGpaVE10TnpGa09HVTJNMkV5TnpVMCJ9';

    // 删除同名进程（防止重复）
    try { execSync('npx pm2 delete cloudflared', { stdio: 'ignore' }); } catch (_) {}

    // 用 shell 的方式让 pm2 启动命令（推荐！最兼容！）
    const shellCmd = `TUNNEL_TRANSPORT_PROTOCOL=http2 TUNNEL_REGION=us ./cloudflared tunnel run --no-autoupdate --token ${token}`;
    const pm2Cmd = `npx pm2 start "bash -c '${shellCmd}'" --name cloudflared --no-autorestart`;

    console.log('用 pm2 启动 cloudflared：', pm2Cmd);

    try {
        execSync(pm2Cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error('启动 cloudflared 失败:', e);
        process.exit(1);
    }
}
