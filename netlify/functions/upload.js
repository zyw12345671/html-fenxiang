// Netlify 函数: upload.js - 处理HTML内容上传
const crypto = require('crypto');
const axios = require('axios');

// 备用内存存储
const memoryStore = new Map();

// GitHub Gist API 配置
// 注意: 需要在 Netlify 环境变量中设置 GITHUB_TOKEN
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID; // 如果已有 Gist，填入 ID

console.log('函数初始化 - 环境变量检查:');
console.log('GITHUB_TOKEN 是否设置:', !!GITHUB_TOKEN);
console.log('GIST_ID 是否设置:', !!GIST_ID);

// 创建 axios 实例用于 GitHub API 请求
const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`, // 从 'token' 改为 'Bearer'
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Netlify-Function'
  }
});

// 保存数据到 GitHub Gist
async function saveToGist(fileId, contentData) {
  try {
    // 如果没有配置 GitHub Token，则无法使用 Gist 存储
    if (!GITHUB_TOKEN) {
      console.log('未配置 GitHub Token，无法使用 Gist 存储');
      return false;
    }
    
    console.log('准备保存到 Gist - fileId:', fileId);
    
    // 获取现有 Gist 数据
    let gistData = {};
    let gistId = GIST_ID;
    
    if (gistId) {
      try {
        console.log('尝试获取现有 Gist - ID:', gistId);
        const response = await githubApi.get(`/gists/${gistId}`);
        // 提取现有数据
        if (response.data.files && response.data.files['html-contents.json']) {
          const content = response.data.files['html-contents.json'].content;
          gistData = JSON.parse(content);
          console.log('成功获取现有 Gist 数据');
        }
      } catch (error) {
        console.error('获取 Gist 失败:', error.message);
        if (error.response) {
          console.error('GitHub API 响应:', error.response.status, JSON.stringify(error.response.data));
        }
        // 如果获取失败，可能是 Gist ID 无效，尝试创建新的
        console.log('将尝试创建新的 Gist');
        gistId = null;
      }
    }
    
    // 添加新数据
    gistData[fileId] = contentData;
    console.log('准备 Gist 数据 - 包含的文件数:', Object.keys(gistData).length);
    
    // 准备 Gist 文件内容
    const files = {
      'html-contents.json': {
        content: JSON.stringify(gistData)
      }
    };
    
    // 创建或更新 Gist
    if (gistId) {
      // 更新现有 Gist
      console.log('正在更新现有 Gist - ID:', gistId);
      await githubApi.patch(`/gists/${gistId}`, {
        files
      });
      console.log('Gist 已更新成功');
    } else {
      // 创建新 Gist
      console.log('正在创建新的 Gist');
      const response = await githubApi.post('/gists', {
        description: 'HTML Content Storage for Netlify Site',
        public: false, // 设置为 private
        files
      });
      console.log('新 Gist 已创建，ID:', response.data.id);
      // 建议将新创建的 Gist ID 保存到环境变量
      console.log('请将此 ID 添加到 Netlify 环境变量 GIST_ID 中');
    }
    
    return true;
  } catch (error) {
    console.error('保存到 Gist 失败:', error.message);
    if (error.response) {
      console.error('GitHub API 响应:', error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error('错误详情:', error.stack);
    }
    return false;
  }
}

// 从 GitHub Gist 获取数据
async function getFromGist(fileId) {
  try {
    if (!GITHUB_TOKEN || !GIST_ID) {
      console.log('获取 Gist 失败 - 缺少 Token 或 ID');
      return null;
    }
    
    console.log('尝试从 Gist 获取数据 - fileId:', fileId);
    const response = await githubApi.get(`/gists/${GIST_ID}`);
    
    if (response.data.files && response.data.files['html-contents.json']) {
      const content = response.data.files['html-contents.json'].content;
      const data = JSON.parse(content);
      const result = data[fileId] || null;
      console.log('Gist 数据获取结果:', result ? '成功' : '未找到');
      return result;
    }
    
    console.log('Gist 中没有找到 html-contents.json 文件');
    return null;
  } catch (error) {
    console.error('从 Gist 获取数据失败:', error.message);
    if (error.response) {
      console.error('GitHub API 响应:', error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error('错误详情:', error.stack);
    }
    return null;
  }
}

exports.handler = async function(event, context) {
    // 添加CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    console.log('收到请求 - 方法:', event.httpMethod);

    // 处理OPTIONS请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        };
    }

    // 只接受POST请求
    if (event.httpMethod !== 'POST') {
        console.log('拒绝非POST请求');
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: '方法不允许' })
        };
    }

    try {
        console.log('接收到上传请求');
        
        // 解析请求体
        if (!event.body) {
            throw new Error('请求体为空');
        }

        const body = JSON.parse(event.body);
        
        if (!body.htmlContent) {
            throw new Error('没有提供HTML内容');
        }

        // 生成唯一ID
        const fileId = 'c2' + generateId(5);
        console.log('生成的文件ID:', fileId);

        // 准备存储的数据
        const contentData = {
            content: body.htmlContent,
            timestamp: Date.now()
        };

        // 存储HTML内容
        let storeSuccess = false;

        // 尝试使用 GitHub Gist 存储
        if (GITHUB_TOKEN) {
            console.log('尝试使用 GitHub Gist 存储');
            storeSuccess = await saveToGist(fileId, contentData);
        }
        
        // 同时保存到内存中作为备份
        memoryStore.set(fileId, contentData);
        console.log('内容已保存到内存中');
        
        if (!storeSuccess && GITHUB_TOKEN) {
            console.log('Gist 存储失败，将仅使用内存存储（不持久）');
        } else if (!GITHUB_TOKEN) {
            console.log('未配置 GitHub Token，仅使用内存存储');
        }

        // 构建访问链接
        const host = event.headers.host || process.env.URL || 'your-site.netlify.app';
        const protocol = event.headers['x-forwarded-proto'] || 'https';
        const viewLink = `${protocol}://${host}/view/${fileId}`;

        console.log('生成的访问链接:', viewLink);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                fileId,
                viewLink,
                message: '文件上传成功',
                storageType: storeSuccess ? 'gist' : 'memory'
            })
        };

    } catch (error) {
        console.error('上传错误:', error.message);
        console.error('错误详情:', error.stack);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: error.message || '服务器错误',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

// 生成随机ID
function generateId(length) {
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex')
        .slice(0, length);
}

// 导出获取内容的函数
exports.getContent = async function(fileId) {
    console.log('getContent 被调用 - fileId:', fileId);
    // 尝试从 Gist 存储获取
    if (GITHUB_TOKEN && GIST_ID) {
        console.log('尝试从 Gist 获取内容');
        const gistData = await getFromGist(fileId);
        if (gistData) {
            console.log('从 Gist 获取内容成功');
            return gistData;
        }
    }
    
    // 回退到内存存储
    console.log('从内存获取内容');
    const memoryData = memoryStore.get(fileId);
    console.log('内存数据获取结果:', memoryData ? '成功' : '未找到');
    return memoryData;
};