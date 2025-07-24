export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Serve HTML page
      if (path === '/' || path === '/index.html') {
        return new Response(getHTML(), {
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders
          }
        });
      }

      // API routes
      if (path === '/api/delivery' && request.method === 'POST') {
        return await handleDelivery(request, env);
      }

      if (path === '/api/records' && request.method === 'GET') {
        return await getRecords(request, env);
      }

      if (path === '/api/status' && request.method === 'GET') {
        return await getStatus(request, env);
      }

      if (path === '/api/clear' && request.method === 'DELETE') {
        return await clearAllData(request, env);
      }

      if (path === '/api/set-initial' && request.method === 'POST') {
        return await setInitialBuckets(request, env);
      }

      if (path === '/api/login' && request.method === 'POST') {
        return await handleLogin(request, env);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

// Handle delivery record
async function handleDelivery(request, env) {
  const data = await request.json();
  const { normalWater, nongfuWater, emptyBuckets } = data;
  
  // Validate input
  if (normalWater < 0 || nongfuWater < 0 || emptyBuckets < 0) {
    return new Response(JSON.stringify({ error: '数量不能为负数' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  // Get current status
  const currentStatus = await env.WATER_KV.get('current_status');
  let status = currentStatus ? JSON.parse(currentStatus) : { emptyBuckets: 0 };
  
  // Calculate new empty bucket count
  const deliveredBuckets = normalWater + nongfuWater;
  status.emptyBuckets = status.emptyBuckets + deliveredBuckets - emptyBuckets;
  
  // Ensure empty buckets count doesn't go negative
  if (status.emptyBuckets < 0) {
    return new Response(JSON.stringify({ 
      error: `空桶数量不足，当前只有 ${status.emptyBuckets + emptyBuckets} 个空桶` 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Create delivery record
  const record = {
    date: today,
    timestamp,
    normalWater,
    nongfuWater,
    totalDelivered: deliveredBuckets,
    emptyBucketsTaken: emptyBuckets,
    remainingEmptyBuckets: status.emptyBuckets
  };
  
  // Save record
  const recordKey = `delivery_${timestamp.replace(/[:.]/g, '_')}`;
  await env.WATER_KV.put(recordKey, JSON.stringify(record));
  
  // Update status
  await env.WATER_KV.put('current_status', JSON.stringify(status));
  
  return new Response(JSON.stringify({ 
    success: true, 
    record,
    currentEmptyBuckets: status.emptyBuckets
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Get delivery records
async function getRecords(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit')) || 50;
  
  const list = await env.WATER_KV.list({ prefix: 'delivery_' });
  const records = [];
  
  // Sort keys by timestamp (newest first)
  const sortedKeys = list.keys.sort((a, b) => b.name.localeCompare(a.name));
  
  for (let i = 0; i < Math.min(limit, sortedKeys.length); i++) {
    const record = await env.WATER_KV.get(sortedKeys[i].name);
    if (record) {
      records.push(JSON.parse(record));
    }
  }
  
  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Get current status
async function getStatus(request, env) {
  const currentStatus = await env.WATER_KV.get('current_status');
  const status = currentStatus ? JSON.parse(currentStatus) : { emptyBuckets: 0 };
  
  return new Response(JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Clear all data
async function clearAllData(request, env) {
  // List all keys and delete them
  const list = await env.WATER_KV.list();
  
  for (const key of list.keys) {
    await env.WATER_KV.delete(key.name);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Set initial buckets
async function setInitialBuckets(request, env) {
  const data = await request.json();
  const { emptyBuckets } = data;
  
  // Validate input
  if (emptyBuckets < 0) {
    return new Response(JSON.stringify({ error: '数量不能为负数' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // Set initial status
  const status = { emptyBuckets: emptyBuckets || 0 };
  await env.WATER_KV.put('current_status', JSON.stringify(status));
  
  return new Response(JSON.stringify({ 
    success: true, 
    emptyBuckets: status.emptyBuckets
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// Handle login
async function handleLogin(request, env) {
  const data = await request.json();
  const { username, password } = data;
  
  // Check credentials
  if (username === 'hack' && password === 'Xx147258.') {
    return new Response(JSON.stringify({ 
      success: true, 
      message: '登录成功'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } else {
    return new Response(JSON.stringify({ 
      success: false, 
      error: '用户名或密码错误'
    }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

// HTML page
function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>桶装水送水记录系统</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
            padding: 20px;
            margin: 0;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
            border: 1px solid #e1e8ed;
        }
        
        .header {
            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .status-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .status-card h3 {
            font-size: 1.2em;
            margin-bottom: 10px;
        }
        
        .empty-buckets {
            font-size: 2em;
            font-weight: bold;
        }
        
        .form-section {
            padding: 30px;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        input[type="number"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input[type="number"]::placeholder {
            color: #999;
            font-style: italic;
        }
        
        input[type="number"]:focus {
            outline: none;
            border-color: #2196F3;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }
        
        .submit-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
        }
        
        .clear-data-section {
            margin-top: 20px;
            text-align: center;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .clear-btn {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }
        
        .clear-btn:hover {
            background: linear-gradient(135deg, #b91c1c, #dc2626);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
        }
        
        .export-btn {
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
        }
        
        .export-btn:hover {
            background: linear-gradient(135deg, #047857, #059669);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
        }
        
        .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .records-section {
            padding: 30px;
            border-top: 1px solid #e1e5e9;
            background: #f8f9fa;
        }
        
        .records-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .refresh-btn {
            padding: 8px 16px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .record-item {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 16px 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            width: 100%;
            min-height: auto;
        }
        
        .record-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #2196F3, #21CBF3, #00BCD4);
            border-radius: 16px 16px 0 0;
        }
        
        .record-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .record-date {
            font-weight: 600;
            color: #2196F3;
            margin-bottom: 12px;
            font-size: 1em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .record-details {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: center;
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: rgba(248, 249, 250, 0.8);
            backdrop-filter: blur(5px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.2s ease;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .detail-item:hover {
            background: rgba(33, 150, 243, 0.1);
            transform: scale(1.02);
        }
        
        .detail-label {
            font-size: 0.8em;
            color: #666;
            margin-bottom: 0;
            font-weight: 500;
            letter-spacing: 0.3px;
        }
        
        .detail-value {
            font-size: 0.9em;
            font-weight: 600;
            color: #2196F3;
        }
        
        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-weight: 500;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .records-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 20px;
        }
        
        .date-filter-section {
            margin: 20px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        
        .date-filter-container {
            display: flex;
            gap: 15px;
            align-items: end;
            flex-wrap: wrap;
        }
        
        .date-input-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .date-input-group label {
            font-size: 0.9em;
            font-weight: 600;
            color: #555;
        }
        
        .date-input {
            padding: 10px 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            transition: all 0.3s ease;
            min-width: 150px;
        }
        
        .date-input:focus {
            outline: none;
            border-color: #2196F3;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }
        
        .filter-btn, .clear-filter-btn {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        
        .filter-btn {
            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
            color: white;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
        }
        
        .filter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }
        
        .clear-filter-btn {
            background: #6c757d;
            color: white;
            box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
        }
        
        .clear-filter-btn:hover {
            background: #5a6268;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
        }
        
        @media (max-width: 768px) {
            body {
                padding: 8px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            }
            
            .container {
                margin: 0;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(20px);
            }
            
            .header {
                padding: 25px 20px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .form-section, .records-section {
                padding: 20px;
            }
            
            .records-grid {
                 gap: 60px;
             }
             
             .record-item {
                 padding: 14px 16px;
                 margin-bottom: 60px;
                 border-radius: 8px;
                 background: rgba(255, 255, 255, 0.9);
                 backdrop-filter: blur(15px);
                 box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
             }
             
             .record-date {
                 font-size: 0.9em;
                 margin-bottom: 10px;
             }
             
             .record-details {
                 gap: 12px;
                 flex-wrap: wrap;
             }
             
             .detail-item {
                 padding: 6px 10px;
                 border-radius: 14px;
                 background: rgba(248, 249, 250, 0.9);
                 gap: 4px;
                 box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
             }
             
             .detail-label {
                 font-size: 0.75em;
             }
             
             .date-filter-section {
                 margin: 15px 0;
                 padding: 15px;
             }
             
             .date-filter-container {
                 flex-direction: column;
                 gap: 12px;
                 align-items: stretch;
             }
             
             .date-input {
                 min-width: auto;
                 width: 100%;
             }
             
             .filter-btn, .clear-filter-btn {
                 width: 100%;
                 padding: 12px;
             }
             
             .detail-value {
                 font-size: 0.85em;
             }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 5px;
            }
            
            .header h1 {
                font-size: 1.8em;
            }
            
            .records-grid {
                 gap: 40px;
             }
             
             .record-item {
                 padding: 12px 14px;
                 margin-bottom: 10px;
                 border-radius: 8px;
                 box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
             }
             
             .record-date {
                 font-size: 0.85em;
                 margin-bottom: 8px;
             }
             
             .record-details {
                 gap: 8px;
                 flex-wrap: wrap;
             }
             
             .detail-item {
                 padding: 5px 8px;
                 border-radius: 12px;
                 gap: 3px;
                 box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
             }
             
             .detail-label {
                 font-size: 0.7em;
             }
             
             .detail-value {
                 font-size: 0.8em;
             }
        }
        
        @media (max-width: 360px) {
            .record-details {
                grid-template-columns: 1fr;
            }
            
            .detail-item {
                margin-bottom: 8px;
            }
        }
        
        .login-container {
            max-width: 400px;
            margin: 50px auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
            border: 1px solid #e1e8ed;
        }
        
        .login-header {
            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .login-form {
            padding: 30px;
        }
        
        .login-form input {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .login-form input:focus {
            outline: none;
            border-color: #2196F3;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }
        
        .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
        }
        
        .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .main-app {
            display: none;
        }
        
        .logout-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .logout-btn:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <!-- Login Page -->
    <div id="loginPage">
        <div class="login-container">
            <div class="login-header">
                <h1>🔐 系统登录</h1>
                <p>请输入用户名和密码</p>
            </div>
            <div class="login-form">
                <form id="loginForm">
                    <input type="text" id="username" placeholder="用户名" required>
                    <input type="password" id="password" placeholder="密码" required>
                    <button type="submit" class="login-btn" id="loginBtn">登录</button>
                </form>
                <div id="loginAlert"></div>
            </div>
        </div>
    </div>
    
    <!-- Main App -->
    <div id="mainApp" class="main-app">
        <div class="container">
            <div class="header">
                <button class="logout-btn" id="logoutBtn">退出登录</button>
                <h1>学院送水记录系统</h1>
                <div class="status-card">
                    <h3>当前空桶存量</h3>
                    <div class="empty-buckets" id="emptyBucketsCount">加载中...</div>
                </div>
            </div>
        
        <div class="form-section">
            <form id="deliveryForm">
                <div class="form-group">
                    <label for="normalWater">普通水送水数量（桶）</label>
                    <input type="number" id="normalWater" min="0" placeholder="请输入" required>
                </div>
                
                <div class="form-group">
                    <label for="nongfuWater">农夫山泉送水数量（桶）</label>
                    <input type="number" id="nongfuWater" min="0" placeholder="请输入" required>
                </div>
                
                <div class="form-group">
                    <label for="emptyBuckets">拿走空桶数量（桶）</label>
                    <input type="number" id="emptyBuckets" min="0" placeholder="请输入" required>
                </div>
                
                <button type="submit" class="submit-btn" id="submitBtn">📝 记录送水</button>
            </form>
            
            <div class="clear-data-section">
                <button type="button" id="exportBtn" class="export-btn">导出Excel</button>
                <button type="button" id="clearDataBtn" class="clear-btn">清空所有数据</button>
            </div>
            
            <div id="alertContainer"></div>
        </div>
        
        <div class="records-section">
            <div class="records-header">
                <h2>📋 送水记录</h2>
                <button class="refresh-btn" id="refreshBtn">🔄 刷新</button>
            </div>
            <div class="date-filter-section">
                <div class="date-filter-container">
                    <div class="date-input-group">
                        <label for="startDate">开始日期：</label>
                        <input type="date" id="startDate" class="date-input">
                    </div>
                    <div class="date-input-group">
                        <label for="endDate">结束日期：</label>
                        <input type="date" id="endDate" class="date-input">
                    </div>
                    <button id="filterBtn" class="filter-btn">📅 筛选</button>
                    <button id="clearFilterBtn" class="clear-filter-btn">🗑️ 清除筛选</button>
                </div>
            </div>
            <div class="records-grid">
                <div id="recordsList">加载中...</div>
            </div>
        </div>
      </div>
    </div>
     
     <script>
         // Check login status on page load
         document.addEventListener('DOMContentLoaded', function() {
             checkLoginStatus();
         });
         
         // Check if user is logged in
         function checkLoginStatus() {
             const isLoggedIn = localStorage.getItem('waterSystemLoggedIn');
             if (isLoggedIn === 'true') {
                 showMainApp();
             } else {
                 showLoginPage();
             }
         }
         
         // Show login page
         function showLoginPage() {
             document.getElementById('loginPage').style.display = 'block';
             document.getElementById('mainApp').style.display = 'none';
         }
         
         // Show main app
         function showMainApp() {
             document.getElementById('loginPage').style.display = 'none';
             document.getElementById('mainApp').style.display = 'block';
             loadStatus();
             loadRecords();
         }
         
         // Login form submission
         document.getElementById('loginForm').addEventListener('submit', async function(e) {
             e.preventDefault();
             
             const loginBtn = document.getElementById('loginBtn');
             const username = document.getElementById('username').value;
             const password = document.getElementById('password').value;
             
             loginBtn.disabled = true;
             loginBtn.textContent = '登录中...';
             
             try {
                 const response = await fetch('/api/login', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json'
                     },
                     body: JSON.stringify({ username, password })
                 });
                 
                 const result = await response.json();
                 
                 if (result.success) {
                     localStorage.setItem('waterSystemLoggedIn', 'true');
                     showLoginAlert('登录成功！', 'success');
                     setTimeout(() => {
                         showMainApp();
                     }, 1000);
                 } else {
                     showLoginAlert(result.error || '登录失败', 'error');
                 }
             } catch (error) {
                 showLoginAlert('网络错误，请重试', 'error');
             }
             
             loginBtn.disabled = false;
             loginBtn.textContent = '登录';
         });
         
         // Logout button
         document.getElementById('logoutBtn').addEventListener('click', function() {
             localStorage.removeItem('waterSystemLoggedIn');
             showLoginPage();
             document.getElementById('loginForm').reset();
         });
         
         // Show login alert
         function showLoginAlert(message, type) {
             const alertContainer = document.getElementById('loginAlert');
             const alertDiv = document.createElement('div');
             alertDiv.className = 'alert alert-' + type;
             alertDiv.textContent = message;
             
             alertContainer.innerHTML = '';
             alertContainer.appendChild(alertDiv);
             
             setTimeout(() => {
                 alertDiv.remove();
             }, 5000);
         }
        
        // Refresh button event
        document.getElementById('refreshBtn').addEventListener('click', function() {
            loadRecords();
        });
        
        // Form submission
        document.getElementById('deliveryForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const alertContainer = document.getElementById('alertContainer');
            
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            
            const formData = {
                normalWater: parseInt(document.getElementById('normalWater').value) || 0,
                nongfuWater: parseInt(document.getElementById('nongfuWater').value) || 0,
                emptyBuckets: parseInt(document.getElementById('emptyBuckets').value) || 0
            };
            
            try {
                const response = await fetch('/api/delivery', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showAlert('记录添加成功！', 'success');
                    document.getElementById('deliveryForm').reset();
                    loadStatus();
                    // Add longer delay to handle KV eventual consistency
                    setTimeout(() => {
                        loadRecords();
                    }, 2000);
                } else {
                    showAlert(result.error || '提交失败', 'error');
                }
            } catch (error) {
                showAlert('网络错误，请重试', 'error');
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = '📝 记录送水';
        });
        
        // Export to Excel button event
        document.getElementById('exportBtn').addEventListener('click', async function() {
            try {
                const response = await fetch('/api/records');
                const records = await response.json();
                
                if (records.length === 0) {
                    showAlert('没有数据可导出', 'error');
                    return;
                }
                
                exportToExcel(records);
                showAlert('Excel文件已生成并下载', 'success');
            } catch (error) {
                showAlert('导出失败，请重试', 'error');
            }
        });
        
        // Clear data button event
        document.getElementById('clearDataBtn').addEventListener('click', function() {
            showClearDataConfirmDialog();
        });
        
        // Date filter button events
        document.getElementById('filterBtn').addEventListener('click', filterRecords);
        document.getElementById('clearFilterBtn').addEventListener('click', clearDateFilter);
        
        // Show clear data confirmation dialog
        function showClearDataConfirmDialog() {
            const alertContainer = document.getElementById('alertContainer');
            const dialogDiv = document.createElement('div');
            dialogDiv.className = 'clear-data-dialog';
            dialogDiv.innerHTML = '<div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ffc107; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">' +
                '<h3 style="color: #856404; margin-bottom: 15px; text-align: center;">⚠️ 确认清空所有数据</h3>' +
                '<p style="color: #856404; margin-bottom: 20px; text-align: center; font-size: 16px;">此操作将永久删除所有送水记录和状态数据，无法恢复！</p>' +
                '<div style="display: flex; gap: 15px; justify-content: center;">' +
                    '<button id="cancelClearBtn" ' +
                            'style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">取消</button>' +
                    '<button id="confirmClearBtn" disabled ' +
                            'style="padding: 12px 24px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: not-allowed; font-size: 16px; font-weight: 600; opacity: 0.6;">确认清空 (10)</button>' +
                '</div>' +
            '</div>';
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(dialogDiv);
            
            // Add event listeners
            document.getElementById('cancelClearBtn').addEventListener('click', function() {
                dialogDiv.remove();
            });
            
            // Start countdown
            let countdown = 10;
            const confirmBtn = document.getElementById('confirmClearBtn');
            
            const countdownInterval = setInterval(() => {
                countdown--;
                confirmBtn.textContent = '确认清空 (' + countdown + ')';
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    confirmBtn.disabled = false;
                    confirmBtn.style.cursor = 'pointer';
                    confirmBtn.style.opacity = '1';
                    confirmBtn.textContent = '确认清空';
                    
                    // Add click event after countdown
                    confirmBtn.addEventListener('click', async function() {
                        confirmBtn.disabled = true;
                        confirmBtn.textContent = '清空中...';
                        
                        try {
                            const response = await fetch('/api/clear', {
                                method: 'DELETE'
                            });
                            
                            if (response.ok) {
                                showAlert('所有数据已清空！', 'success');
                                dialogDiv.remove();
                                showInitialBucketInput();
                                loadStatus();
                                loadRecords();
                            } else {
                                showAlert('清空失败，请重试', 'error');
                                dialogDiv.remove();
                            }
                        } catch (error) {
                            showAlert('网络错误，请重试', 'error');
                            dialogDiv.remove();
                        }
                    });
                }
            }, 1000);
            
            // Clean up interval if dialog is removed
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        const removed = Array.from(mutation.removedNodes);
                        if (removed.includes(dialogDiv)) {
                            clearInterval(countdownInterval);
                            observer.disconnect();
                        }
                    }
                });
            });
            observer.observe(alertContainer, { childList: true });
        }
        
        // Load current status
        async function loadStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                document.getElementById('emptyBucketsCount').textContent = status.emptyBuckets + ' 桶';
            } catch (error) {
                document.getElementById('emptyBucketsCount').textContent = '加载失败';
            }
        }
        
        // Load records with enhanced retry mechanism and date filtering
        async function loadRecords(retryCount = 0, lastRecordCount = 0, startDate = null, endDate = null) {
            const recordsList = document.getElementById('recordsList');
            if (retryCount === 0) {
                recordsList.innerHTML = '加载中...';
            }
            
            try {
                let url = '/api/records?limit=20&_t=' + Date.now();
                if (startDate) {
                    url += '&startDate=' + encodeURIComponent(startDate);
                }
                if (endDate) {
                    url += '&endDate=' + encodeURIComponent(endDate);
                }
                
                const response = await fetch(url);
                const allRecords = await response.json();
                
                // Client-side filtering if server doesn't support date filtering
                let records = allRecords;
                if (startDate || endDate) {
                    records = allRecords.filter(record => {
                        const recordDate = new Date(record.timestamp);
                        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                        const end = endDate ? new Date(endDate + 'T23:59:59') : null;
                        
                        if (start && recordDate < start) return false;
                        if (end && recordDate > end) return false;
                        return true;
                    });
                }
                
                // If this is a retry and we still have the same number of records as before,
                // continue retrying (this handles KV eventual consistency)
                if (retryCount > 0 && records.length === lastRecordCount && retryCount < 5) {
                    setTimeout(() => {
                        loadRecords(retryCount + 1, records.length);
                    }, 1500);
                    return;
                }
                
                if (records.length === 0) {
                    recordsList.innerHTML = '<p style="text-align: center; color: #666;">暂无送水记录</p>';
                    return;
                }
                
                recordsList.innerHTML = records.map(record => 
                    '<div class="record-item">' +
                        '<div class="record-date">' +
                            '📅 ' + new Date(record.timestamp).toLocaleString('zh-CN') +
                        '</div>' +
                        '<div class="record-details">' +
                            '<div class="detail-item">' +
                                '<div class="detail-label">普通水</div>' +
                                '<div class="detail-value">' + record.normalWater + ' 桶</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-label">农夫山泉</div>' +
                                '<div class="detail-value">' + record.nongfuWater + ' 桶</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-label">总送水量</div>' +
                                '<div class="detail-value">' + record.totalDelivered + ' 桶</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-label">拿走空桶</div>' +
                                '<div class="detail-value">' + record.emptyBucketsTaken + ' 桶</div>' +
                            '</div>' +
                            '<div class="detail-item">' +
                                '<div class="detail-label">剩余空桶</div>' +
                                '<div class="detail-value">' + record.remainingEmptyBuckets + ' 桶</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                ).join('');
            } catch (error) {
                if (retryCount < 5) {
                    // Retry after a delay
                    setTimeout(() => {
                        loadRecords(retryCount + 1, lastRecordCount);
                    }, 1500);
                } else {
                    recordsList.innerHTML = '<p style="text-align: center; color: #e74c3c;">加载记录失败</p>';
                }
            }
        }
        
        // Show alert message
        function showAlert(message, type) {
            const alertContainer = document.getElementById('alertContainer');
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-' + type;
            alertDiv.textContent = message;
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alertDiv);
            
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
        
        // Show initial bucket input
        function showInitialBucketInput() {
            const alertContainer = document.getElementById('alertContainer');
            const inputDiv = document.createElement('div');
            inputDiv.className = 'initial-bucket-input';
            inputDiv.innerHTML = '<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #2196F3;">' +
                '<h3 style="color: #1976d2; margin-bottom: 15px;">设置初始空桶数量</h3>' +
                '<div style="display: flex; gap: 10px; align-items: center;">' +
                    '<input type="number" id="initialBuckets" min="0" placeholder="请输入初始空桶数量" ' +
                           'style="flex: 1; padding: 10px; border: 2px solid #2196F3; border-radius: 5px; font-size: 16px;">' +
                    '<button id="confirmInitialBtn" ' +
                            'style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">确认</button>' +
                    '<button id="skipInitialBtn" ' +
                            'style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">跳过</button>' +
                '</div>' +
            '</div>';
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(inputDiv);
            
            // Add event listeners
            document.getElementById('confirmInitialBtn').addEventListener('click', setInitialBuckets);
            document.getElementById('skipInitialBtn').addEventListener('click', skipInitialBuckets);
        }
        
        // Set initial buckets
        async function setInitialBuckets() {
            const initialBuckets = parseInt(document.getElementById('initialBuckets').value) || 0;
            
            try {
                const response = await fetch('/api/set-initial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ emptyBuckets: initialBuckets })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        showAlert('初始空桶数量已设置为 ' + initialBuckets + ' 桶', 'success');
                        document.querySelector('.initial-bucket-input').remove();
                        loadStatus();
                    } else {
                        showAlert(result.error || '设置失败，请重试', 'error');
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    showAlert(errorData.error || '设置失败，请重试', 'error');
                }
            } catch (error) {
                console.error('设置初始桶数错误:', error);
                showAlert('网络错误: ' + error.message, 'error');
            }
        }
        
        // Skip initial buckets setup
        function skipInitialBuckets() {
            document.querySelector('.initial-bucket-input').remove();
            showAlert('已跳过初始空桶设置', 'success');
        }
        
        // Export to Excel function
        function exportToExcel(records) {
            // Create CSV content
            const headers = ['日期', '时间', '普通水桶数', '农夫山泉桶数', '总送水量桶数', '拿走空桶数', '剩余空桶数'];
            let csvContent = headers.join(',') + '\\n';
            
            records.forEach(record => {
                const date = new Date(record.timestamp);
                const row = [
                    record.date || date.toLocaleDateString('zh-CN'),
                    date.toLocaleTimeString('zh-CN'),
                    record.normalWater || 0,
                    record.nongfuWater || 0,
                    record.totalDelivered || (record.normalWater + record.nongfuWater),
                    record.emptyBucketsTaken || record.emptyBuckets || 0,
                    record.remainingEmptyBuckets || 0
                ];
                csvContent += row.join(',') + '\\n';
            });
            
            // Add BOM for UTF-8 to ensure Chinese characters display correctly in Excel
            const BOM = '\\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            
            // Create download link
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.getFullYear() + '-' + 
                          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(now.getDate()).padStart(2, '0');
            link.setAttribute('download', '送水记录_' + dateStr + '.csv');
            
            // Trigger download
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Filter records by date range
        function filterRecords() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate && !endDate) {
                showAlert('请至少选择一个日期', 'error');
                return;
            }
            
            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                showAlert('开始日期不能晚于结束日期', 'error');
                return;
            }
            
            loadRecords(0, 0, startDate, endDate);
            showAlert('已应用日期筛选', 'success');
        }
        
        // Clear date filter
        function clearDateFilter() {
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            loadRecords();
            showAlert('已清除日期筛选', 'success');
        }
    </script>
</body>
</html>`;
}