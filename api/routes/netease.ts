/**
 * 网易云音乐API代理路由
 * 解决CORS问题，代理网易云音乐接口
 */
import { Router, type Request, type Response } from 'express';
import axios from 'axios';

const router = Router();

// API基础URL配置
const NETEASE_API_BASE = 'https://netease-cloud-music-api-one-psi.vercel.app';
const BACKUP_API_BASE = 'https://netease-cloud-music-api-git-master-binaryify.vercel.app';
const THIRD_API_BASE = 'https://music-api.heheda.top';
const FOURTH_API_BASE = 'https://music.163.com';

// 代理配置管理
class ProxyManager {
  private static proxyList: string[] = [
    // 可以添加代理服务器列表
    // 'http://proxy1.example.com:8080',
    // 'http://proxy2.example.com:8080',
  ];
  private static currentProxyIndex = 0;
  private static proxyErrorCount: Map<string, number> = new Map();
  private static readonly MAX_PROXY_ERRORS = 3;
  
  static getNextProxy(): string | null {
    if (this.proxyList.length === 0) {
      return null;
    }
    
    // 寻找可用的代理
    for (let i = 0; i < this.proxyList.length; i++) {
      const proxy = this.proxyList[this.currentProxyIndex];
      const errorCount = this.proxyErrorCount.get(proxy) || 0;
      
      if (errorCount < this.MAX_PROXY_ERRORS) {
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
        return proxy;
      }
      
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    }
    
    return null;
  }
  
  static markProxyError(proxy: string): void {
    const errorCount = this.proxyErrorCount.get(proxy) || 0;
    this.proxyErrorCount.set(proxy, errorCount + 1);
    console.log(`代理 ${proxy} 错误次数: ${errorCount + 1}`);
  }
  
  static resetProxyErrors(): void {
    this.proxyErrorCount.clear();
    console.log('重置所有代理错误计数');
  }
}

// IP轮换和请求间隔管理
class RequestManager {
  private static lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL = 1000; // 1秒最小间隔
  private static requestCount = 0;
  private static readonly MAX_REQUESTS_PER_MINUTE = 30;
  private static minuteStartTime = Date.now();
  
  static async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    
    // 检查每分钟请求限制
    if (now - this.minuteStartTime > 60000) {
      this.requestCount = 0;
      this.minuteStartTime = now;
    }
    
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - (now - this.minuteStartTime);
      console.log(`请求频率限制，等待 ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.minuteStartTime = Date.now();
    }
    
    // 检查最小请求间隔
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
}

// API状态管理
class ApiManager {
  private static apiStatus: Map<string, { available: boolean; lastCheck: number; errorCount: number }> = new Map();
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟
  private static readonly MAX_ERROR_COUNT = 3;
  
  static getAvailableApis(): string[] {
    const apis = [NETEASE_API_BASE, BACKUP_API_BASE, THIRD_API_BASE];
    const now = Date.now();
    
    return apis.filter(api => {
      const status = this.apiStatus.get(api);
      if (!status) {
        // 新API，默认可用
        this.apiStatus.set(api, { available: true, lastCheck: now, errorCount: 0 });
        return true;
      }
      
      // 检查是否需要重置状态
      if (now - status.lastCheck > this.CHECK_INTERVAL) {
        status.available = true;
        status.errorCount = 0;
        status.lastCheck = now;
      }
      
      return status.available;
    });
  }
  
  static markApiError(apiUrl: string): void {
    const status = this.apiStatus.get(apiUrl) || { available: true, lastCheck: Date.now(), errorCount: 0 };
    status.errorCount++;
    status.lastCheck = Date.now();
    
    if (status.errorCount >= this.MAX_ERROR_COUNT) {
      status.available = false;
      console.log(`API ${apiUrl} 标记为不可用，错误次数: ${status.errorCount}`);
    }
    
    this.apiStatus.set(apiUrl, status);
  }
  
  static markApiSuccess(apiUrl: string): void {
    const status = this.apiStatus.get(apiUrl) || { available: true, lastCheck: Date.now(), errorCount: 0 };
    status.errorCount = 0;
    status.available = true;
    status.lastCheck = Date.now();
    this.apiStatus.set(apiUrl, status);
  }
}

// 标准请求头配置，模拟真实浏览器环境
const getStandardHeaders = (cookie?: string) => {
  const headers: any = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://music.163.com/',
    'Origin': 'https://music.163.com',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  };
  
  if (cookie) {
    headers.Cookie = cookie;
  }
  
  return headers;
};

// 创建axios实例配置
const createAxiosConfig = (cookie?: string, timeout: number = 15000, useProxy: boolean = false) => {
  const config: any = {
    headers: getStandardHeaders(cookie),
    timeout,
    withCredentials: true,
    validateStatus: (status: number) => status < 500 // 允许4xx状态码通过，便于处理业务错误
  };
  
  // 添加代理支持
  if (useProxy) {
    const proxy = ProxyManager.getNextProxy();
    if (proxy) {
      config.proxy = {
        protocol: proxy.startsWith('https') ? 'https' : 'http',
        host: proxy.split('://')[1].split(':')[0],
        port: parseInt(proxy.split(':')[2] || '80'),
      };
      console.log(`使用代理: ${proxy}`);
    }
  }
  
  return config;
};

// 智能API请求函数
const smartApiRequest = async (endpoint: string, method: 'GET' | 'POST' = 'POST', data?: any, config?: any): Promise<any> => {
  // 等待请求间隔
  await RequestManager.waitForNextRequest();
  
  const availableApis = ApiManager.getAvailableApis();
  
  if (availableApis.length === 0) {
    throw new Error('所有API服务暂时不可用，请稍后重试');
  }
  
  let lastError: any;
  let useProxy = false;
  
  for (let apiIndex = 0; apiIndex < availableApis.length; apiIndex++) {
    const apiBase = availableApis[apiIndex];
    
    // 如果前面的API都失败了，尝试使用代理
    if (apiIndex > 0) {
      useProxy = true;
    }
    
    try {
      console.log(`尝试API: ${apiBase}${endpoint}${useProxy ? ' (使用代理)' : ''}`);
      
      // 创建配置，可能包含代理
      const requestConfig = { ...config };
      if (useProxy) {
        const proxy = ProxyManager.getNextProxy();
        if (proxy) {
          requestConfig.proxy = {
            protocol: proxy.startsWith('https') ? 'https' : 'http',
            host: proxy.split('://')[1].split(':')[0],
            port: parseInt(proxy.split(':')[2] || '80'),
          };
          console.log(`使用代理: ${proxy}`);
        }
      }
      
      let response;
      if (method === 'GET') {
        response = await axios.get(`${apiBase}${endpoint}`, requestConfig);
      } else {
        response = await axios.post(`${apiBase}${endpoint}`, data, requestConfig);
      }
      
      console.log(`API ${apiBase} 请求成功:`, { code: response.data.code });
      
      // 检查是否为安全风险错误
      if (response.data.code === 8810) {
        console.log(`API ${apiBase} 返回安全风险错误8810`);
        ApiManager.markApiError(apiBase);
        
        // 如果使用了代理但仍然失败，标记代理错误
        if (useProxy && requestConfig.proxy) {
          const proxyUrl = `${requestConfig.proxy.protocol}://${requestConfig.proxy.host}:${requestConfig.proxy.port}`;
          ProxyManager.markProxyError(proxyUrl);
        }
        
        lastError = {
          response: {
            data: {
              code: 8810,
              message: '当前网络环境存在安全风险，请稍后重试或更换网络环境',
              suggestion: '建议：1. 稍后重试 2. 更换网络环境 3. 使用移动网络 4. 联系管理员配置代理'
            }
          }
        };
        continue;
      }
      
      // 标记API成功
      ApiManager.markApiSuccess(apiBase);
      return response;
      
    } catch (error: any) {
      console.log(`API ${apiBase} 请求失败:`, error.message);
      console.log(`API ${apiBase} 错误详情:`, error.response?.data || error.message);
      
      // 标记API错误
      ApiManager.markApiError(apiBase);
      
      // 如果使用了代理但仍然失败，标记代理错误
      if (useProxy && config?.proxy) {
        const proxyUrl = `${config.proxy.protocol}://${config.proxy.host}:${config.proxy.port}`;
        ProxyManager.markProxyError(proxyUrl);
      }
      
      lastError = error;
      
      // 检查是否为8810错误
      if (error.response?.data?.code === 8810) {
        lastError = {
          response: {
            data: {
              code: 8810,
              message: '当前网络环境存在安全风险，请稍后重试或更换网络环境',
              originalMessage: error.response.data.message,
              suggestion: '建议：1. 稍后重试 2. 更换网络环境 3. 使用移动网络 4. 联系管理员配置代理'
            }
          }
        };
      }
    }
  }
  
  // 所有API都失败了
  throw lastError;
};

/**
 * 测试API连通性
 * GET /api/netease/test
 */
router.get('/test', async (req: Request, res: Response): Promise<void> => {
  const results = [];
  
  // 测试主API
  try {
    const response = await axios.get(`${NETEASE_API_BASE}/login/status`, { timeout: 5000 });
    results.push({ api: 'primary', status: 'success', url: NETEASE_API_BASE });
  } catch (error: any) {
    results.push({ api: 'primary', status: 'failed', url: NETEASE_API_BASE, error: error.message });
  }
  
  // 测试备用API
  try {
    const response = await axios.get(`${BACKUP_API_BASE}/login/status`, { timeout: 5000 });
    results.push({ api: 'backup', status: 'success', url: BACKUP_API_BASE });
  } catch (error: any) {
    results.push({ api: 'backup', status: 'failed', url: BACKUP_API_BASE, error: error.message });
  }
  
  res.json({ results, timestamp: new Date().toISOString() });
});

/**
 * 用户登录
 * POST /api/netease/login/cellphone
 */
router.post('/login/cellphone', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, captcha, cookie } = req.body;
    
    console.log('=== 登录请求开始 ===');
    console.log('接收到的请求参数:', { phone, password: password ? '***' : undefined, captcha, cookie: cookie ? '存在' : '不存在' });
    
    if (!phone) {
      console.log('登录失败: 手机号为空');
      res.status(400).json({
        code: 400,
        message: '手机号不能为空'
      });
      return;
    }

    if (!password && !captcha) {
      console.log('登录失败: 密码和验证码都为空');
      res.status(400).json({
        code: 400,
        message: '密码或验证码不能为空'
      });
      return;
    }

    const requestData: any = { phone };
    if (password) {
      requestData.password = password;
    }
    if (captcha) {
      requestData.captcha = captcha;
    }

    console.log('准备发送到网易云API的数据:', { ...requestData, password: requestData.password ? '***' : undefined });
    
    const axiosConfig = createAxiosConfig(cookie);
    const response = await smartApiRequest('/login/cellphone', 'POST', requestData, axiosConfig);

    console.log('网易云API完整响应:', response.data);
    console.log('=== 登录请求结束 ===');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('=== 登录最终失败 ===');
    console.error('错误信息:', error.message);
    console.error('错误详情:', error.response?.data || error);
    console.error('错误状态码:', error.response?.status);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '登录失败',
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * 发送验证码
 * POST /api/netease/captcha/sent
 */
router.post('/captcha/sent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, cookie } = req.body;
    
    console.log('=== 发送验证码请求开始 ===');
    console.log('接收到的手机号:', phone);
    console.log('接收到的cookie:', cookie ? '存在' : '不存在');
    
    if (!phone) {
      console.log('发送验证码失败: 手机号为空');
      res.status(400).json({
        code: 400,
        message: '手机号不能为空'
      });
      return;
    }

    const requestData = { phone };
    console.log('准备发送验证码请求:', requestData);
    
    const axiosConfig = createAxiosConfig(cookie);
    const response = await smartApiRequest('/captcha/sent', 'POST', requestData, axiosConfig);

    console.log('验证码API完整响应:', response.data);
    console.log('=== 发送验证码请求结束 ===');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('=== 发送验证码最终失败 ===');
    console.error('错误信息:', error.message);
    console.error('错误详情:', error.response?.data || error);
    console.error('错误状态码:', error.response?.status);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '发送验证码失败',
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * 检查登录状态
 * POST /api/netease/login/status
 */
router.post('/login/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookie } = req.body;
    
    console.log('=== 检查登录状态请求开始 ===');
    console.log('接收到的cookie:', cookie ? '存在' : '不存在');
    
    const axiosConfig = createAxiosConfig(cookie);
    const response = await smartApiRequest('/login/status', 'POST', {}, axiosConfig);
    
    console.log('登录状态API完整响应:', response.data);
    console.log('=== 检查登录状态请求结束 ===');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('=== 检查登录状态最终失败 ===');
    console.error('错误信息:', error.message);
    console.error('错误详情:', error.response?.data || error);
    console.error('错误状态码:', error.response?.status);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '检查登录状态失败',
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * 刷新登录状态
 * POST /api/netease/login/refresh
 */
router.post('/login/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cookie } = req.body;
    
    console.log('=== 刷新登录状态请求开始 ===');
    console.log('接收到的cookie:', cookie ? '存在' : '不存在');
    
    if (!cookie) {
      console.log('刷新登录失败: cookie为空');
      res.status(400).json({
        code: 400,
        message: 'cookie不能为空'
      });
      return;
    }
    
    const axiosConfig = createAxiosConfig(cookie);
    const response = await smartApiRequest('/login/refresh', 'POST', {}, axiosConfig);
    
    console.log('刷新登录状态API完整响应:', response.data);
    console.log('=== 刷新登录状态请求结束 ===');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('=== 刷新登录状态最终失败 ===');
    console.error('错误信息:', error.message);
    console.error('错误详情:', error.response?.data || error);
    console.error('错误状态码:', error.response?.status);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '刷新登录状态失败',
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * 获取用户歌单
 * GET /api/netease/user/playlist
 */
router.get('/user/playlist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, cookie } = req.query;
    
    if (!uid) {
      res.status(400).json({
        code: 400,
        message: '用户ID不能为空'
      });
      return;
    }

    const axiosConfig = createAxiosConfig(cookie as string);
    axiosConfig.params = { uid };

    const response = await smartApiRequest('/user/playlist', 'GET', undefined, axiosConfig);

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌单失败:', error.message);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '获取歌单失败',
      error: error.message
    });
  }
});

/**
 * 获取歌单详情
 * GET /api/netease/playlist/detail
 */
router.get('/playlist/detail', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, cookie } = req.query;
    
    if (!id) {
      res.status(400).json({
        code: 400,
        message: '歌单ID不能为空'
      });
      return;
    }

    const axiosConfig = createAxiosConfig(cookie as string);
    axiosConfig.params = { id };

    const response = await smartApiRequest('/playlist/detail', 'GET', undefined, axiosConfig);

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌单详情失败:', error.message);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '获取歌单详情失败',
      error: error.message
    });
  }
});

/**
 * 获取歌曲播放地址
 * GET /api/netease/song/url
 */
router.get('/song/url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, br = 320000, cookie } = req.query;
    
    if (!id) {
      res.status(400).json({
        code: 400,
        message: '歌曲ID不能为空'
      });
      return;
    }

    const axiosConfig = createAxiosConfig(cookie as string);
    axiosConfig.params = { id, br };

    const response = await smartApiRequest('/song/url', 'GET', undefined, axiosConfig);

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌曲播放地址失败:', error.message);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '获取歌曲播放地址失败',
      error: error.message
    });
  }
});

/**
 * 获取歌曲详情
 * GET /api/netease/song/detail
 */
router.get('/song/detail', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, cookie } = req.query;
    
    if (!ids) {
      res.status(400).json({
        code: 400,
        message: '歌曲ID列表不能为空'
      });
      return;
    }

    const axiosConfig = createAxiosConfig(cookie as string);
    axiosConfig.params = { ids };

    const response = await smartApiRequest('/song/detail', 'GET', undefined, axiosConfig);

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌曲详情失败:', error.message);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '获取歌曲详情失败',
      error: error.message
    });
  }
});







/**
 * 搜索歌曲
 * GET /api/netease/search
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { keywords, limit = 30, offset = 0, cookie } = req.query;
    
    if (!keywords) {
      res.status(400).json({
        code: 400,
        message: '搜索关键词不能为空'
      });
      return;
    }

    const axiosConfig = createAxiosConfig(cookie as string);
    axiosConfig.params = {
      keywords,
      limit,
      offset,
      type: 1 // 1: 单曲
    };

    const response = await smartApiRequest('/search', 'GET', undefined, axiosConfig);

    res.json(response.data);
  } catch (error: any) {
    console.error('搜索歌曲失败:', error.message);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      res.status(400).json(error.response.data);
      return;
    }
    
    res.status(500).json({
      code: 500,
      message: '搜索歌曲失败',
      error: error.message
    });
  }
});

export default router;