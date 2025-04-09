// Netlify 函数: deleteContent.js - 删除HTML内容
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
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

  // 只接受DELETE请求
  if (event.httpMethod !== 'DELETE') {
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
    
    // 从路径中获取ID
    // 路径格式: /.netlify/functions/deleteContent/ID 或 /api/deleteContent/ID
    const pathParts = event.path.split('/');
    console.log('路径部分:', pathParts);
    
    // 获取最后一个非空部分
    let fileId = null;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      if (pathParts[i] && pathParts[i] !== '') {
        fileId = pathParts[i];
        break;
      }
    }
    
    console.log('解析出的文件ID:', fileId);
    
    if (!fileId) {
      console.log('错误: 缺少内容ID');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: '缺少内容ID'
        })
      };
    }
    
    // 获取KV存储
    const contentStore = await getKVStore(KV_NAMESPACE);
    
    // 检查内容是否存在
    const existingContent = await contentStore.get(fileId);
    if (!existingContent) {
      console.log(`错误: 找不到ID为 ${fileId} 的内容`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          message: '找不到请求的内容'
        })
      };
    }
    
    // 删除内容
    await contentStore.delete(fileId);
    console.log(`成功删除ID为 ${fileId} 的内容`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `已成功删除ID为 ${fileId} 的内容`
      })
    };
    
  } catch (error) {
    console.error('删除内容错误:', error);
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