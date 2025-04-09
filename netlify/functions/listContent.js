// Netlify 函数: listContent.js - 获取所有已上传的HTML内容列表
const { getKVStore } = require('@netlify/functions');

// KV存储名称
const KV_NAMESPACE = 'html-content';

// 管理员密钥 - 优先从环境变量获取
const ADMIN_KEY = process.env.ADMIN_KEY || 'hihtml-admin-2023';

exports.handler = async function(event, context) {
  // 添加CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只接受GET请求
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: '方法不允许' })
    };
  }

  try {
    // 验证管理员权限
    const authHeader = event.headers.authorization || '';
    const providedKey = authHeader.replace('Bearer ', '');
    
    if (providedKey !== ADMIN_KEY) {
      console.log('管理员验证失败');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: '未授权访问' 
        })
      };
    }
    
    console.log('管理员验证成功，正在获取内容列表');
    
    // 获取KV存储
    const contentStore = await getKVStore(KV_NAMESPACE);
    
    // 获取所有键
    const keys = await contentStore.list();
    console.log('找到的键数量:', keys.length);
    
    // 获取每个键的值
    const contentList = [];
    for (const key of keys) {
      try {
        const contentJSON = await contentStore.get(key);
        if (contentJSON) {
          const content = JSON.parse(contentJSON);
          // 添加ID和截断的内容预览
          contentList.push({
            id: key,
            preview: content.content.substring(0, 150) + '...',
            timestamp: content.timestamp,
            created: new Date(content.timestamp).toLocaleString()
          });
        }
      } catch (error) {
        console.error(`获取键 ${key} 的内容时出错:`, error);
      }
    }
    
    // 按创建时间排序，最新的在前面
    contentList.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: contentList.length,
        items: contentList
      })
    };
    
  } catch (error) {
    console.error('列出内容错误:', error);
    console.error('详细错误信息:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: '服务器错误: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}; 