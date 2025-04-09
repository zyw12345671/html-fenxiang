document.addEventListener('DOMContentLoaded', function() {
    // 深色模式切换
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.documentElement; // 使用:root而不是body
    
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('light-mode');
    });
    
    // 获取DOM元素
    const htmlForm = document.getElementById('generate-link');
    const htmlInput = document.getElementById('html-content');
    const fileInput = document.getElementById('file-input');
    const resultArea = document.getElementById('result');
    const generatedLink = document.getElementById('generated-link');
    const visitLink = document.getElementById('visit-link');
    const copyBtn = document.getElementById('copy-link');
    const clearBtn = document.getElementById('clear-button');
    const dropzone = document.getElementById('dropzone');
    
    // 清除按钮功能
    clearBtn.addEventListener('click', function() {
        htmlInput.value = '';
        hideResult();
    });
    
    // 文件上传处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                htmlInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
    
    // 拖放功能
    htmlInput.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = 'var(--accent-color1)';
    });
    
    htmlInput.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '';
    });
    
    htmlInput.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '';
        
        const file = e.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                htmlInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
    
    // 表单提交处理
    htmlForm.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const htmlContent = htmlInput.value.trim();
        
        if (!htmlContent) {
            showToast('请输入HTML代码或上传HTML文件', true);
            return;
        }
        
        // 模拟加载状态
        const originalButtonText = htmlForm.innerHTML;
        htmlForm.disabled = true;
        htmlForm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        try {
            console.log('正在准备上传HTML内容...');
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    htmlContent: htmlContent
                })
            });
            
            console.log('服务器响应状态:', response.status);
            
            if (!response.ok) {
                throw new Error(`上传失败 (${response.status})`);
            }
            
            const data = await response.json();
            console.log('服务器响应数据:', data);
            
            if (!data.success) {
                throw new Error(data.message || '服务器处理失败');
            }
            
            // 显示结果
            resultArea.style.display = 'block';
            generatedLink.value = data.viewLink;
            visitLink.href = data.viewLink;
            
            // 显示成功消息
            showToast('链接生成成功！', false);
            
            // 滚动到结果区域
            resultArea.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('上传错误:', error);
            showToast(error.message || '上传失败，请稍后重试', true);
        } finally {
            // 恢复按钮状态
            htmlForm.disabled = false;
            htmlForm.innerHTML = originalButtonText;
        }
    });
    
    // 复制链接功能
    copyBtn.addEventListener('click', function() {
        generatedLink.select();
        navigator.clipboard.writeText(generatedLink.value)
            .then(() => {
                showToast('链接已复制到剪贴板', false);
            })
            .catch(err => {
                console.error('无法复制:', err);
                showToast('复制失败，请手动复制', true);
            });
    });
    
    // 隐藏结果区域
    function hideResult() {
        resultArea.style.display = 'none';
    }
    
    // 显示提示消息
    function showToast(message, isError) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        if (isError) {
            toast.style.backgroundColor = '#e05d44';
            toast.style.color = 'white';
        } else {
            toast.style.backgroundColor = '#4ecdc4';
            toast.style.color = 'white';
        }
        
        document.body.appendChild(toast);
        
        // 显示提示
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // 隐藏提示
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            toast.style.opacity = '0';
            
            // 移除元素
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // 生成随机ID
    function generateRandomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 7; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // 为了匹配图片中的颜色，确保前两位是c2
        return 'c2' + result.substring(0, 5);
    }
    
    // 如果当前页面是查看页面，尝试加载内容
    if (window.location.pathname.startsWith('/view/')) {
        const contentId = window.location.pathname.split('/').pop();
        if (contentId) {
            fetch(`/api/view/${contentId}`)
                .then(response => response.text())
                .then(content => {
                    document.write(content);
                    document.close();
                })
                .catch(error => {
                    console.error('加载内容失败:', error);
                    document.body.innerHTML = `
                        <div style="padding: 20px; text-align: center; font-family: sans-serif;">
                            <h1>内容未找到</h1>
                            <p>无法找到请求的内容，可能已过期或不存在</p>
                            <p><a href="/">返回首页</a></p>
                        </div>
                    `;
                });
        }
    }
});