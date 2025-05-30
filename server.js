const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 使用内存数据库存储位置信息
const positions = {};

// 启用CORS
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: '位置共享服务运行正常',
        timestamp: new Date().toISOString(),
        pairsCount: Object.keys(positions).length
    });
});

// 保存位置信息
app.post('/position', (req, res) => {
    const { pairCode, role, position } = req.body;
    
    if (!pairCode || !role || !position) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 初始化配对组
    if (!positions[pairCode]) {
        positions[pairCode] = {};
    }
    
    // 保存位置
    positions[pairCode][role] = position;
    
    // 清理旧数据（超过5分钟）
    Object.keys(positions).forEach(code => {
        Object.keys(positions[code]).forEach(r => {
            const positionTime = new Date(positions[code][r].timestamp);
            const diff = (new Date() - positionTime) / 60000; // 分钟
            
            if (diff > 5) {
                delete positions[code][r];
            }
        });
    });
    
    res.status(200).json({ success: true });
});

// 获取配对组的位置信息
app.get('/position/:pairCode', (req, res) => {
    const pairCode = req.params.pairCode;
    
    if (!positions[pairCode]) {
        return res.status(404).json({ error: '配对码不存在或已过期' });
    }
    
    res.status(200).json(positions[pairCode]);
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${port}`);
});