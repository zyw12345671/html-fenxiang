// Netlify 函数: getContent.js - 获取保存的HTML内容
const { getContent } = require('./upload');

exports.handler = async function(event, context) {
  // 添加CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
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
    // 从路径中获取文件ID
    const pathParts = event.path.split('/');
    const fileId = pathParts[pathParts.length - 1];

    if (!fileId) {
      throw new Error('未提供文件ID');
    }

    console.log('正在获取内容，文件ID:', fileId);

    // 获取HTML内容
    const contentData = await getContent(fileId);

    if (!contentData) {
      console.log('找不到内容，文件ID:', fileId);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          message: '找不到请求的内容'
        })
      };
    }

    console.log('内容获取成功，文件ID:', fileId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        content: contentData.content,
        timestamp: contentData.timestamp
      })
    };

  } catch (error) {
    console.error('获取内容错误:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message || '服务器错误'
      })
    };
  }
};