/**
 * 网易云音乐API代理路由
 * 解决CORS问题，代理网易云音乐接口
 */
import { Router, type Request, type Response } from 'express';
import axios from 'axios';

const router = Router();

// 网易云音乐API基础URL - 使用备用API服务
const NETEASE_API_BASE = 'https://apis.netstart.cn/music';
const BACKUP_API_BASE = 'https://netease-cloud-music-api-tau-six.vercel.app';
const THIRD_API_BASE = 'https://music.163.com/api';

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
    const { phone, password, captcha } = req.body;
    
    console.log('=== 登录请求开始 ===');
    console.log('接收到的请求参数:', { phone, password: password ? '***' : undefined, captcha });
    
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
    console.log('使用的API地址:', `${NETEASE_API_BASE}/login/cellphone`);

    // 尝试主API
    let response;
    try {
      response = await axios.post(`${NETEASE_API_BASE}/login/cellphone`, requestData, { timeout: 15000 });
      console.log('主API响应成功:', { code: response.data.code, message: response.data.message });
    } catch (primaryError: any) {
      console.log('主API失败，尝试备用API:', primaryError.message);
      console.log('主API错误详情:', primaryError.response?.data || primaryError.message);
      
      try {
        response = await axios.post(`${BACKUP_API_BASE}/login/cellphone`, requestData, { timeout: 15000 });
        console.log('备用API响应成功:', { code: response.data.code, message: response.data.message });
      } catch (backupError: any) {
        console.log('备用API也失败:', backupError.message);
        console.log('备用API错误详情:', backupError.response?.data || backupError.message);
        throw backupError;
      }
    }

    console.log('网易云API完整响应:', response.data);
    console.log('=== 登录请求结束 ===');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('=== 登录最终失败 ===');
    console.error('错误信息:', error.message);
    console.error('错误详情:', error.response?.data || error);
    console.error('错误状态码:', error.response?.status);
    
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
    const { phone } = req.body;
    
    console.log('=== 发送验证码请求开始 ===');
    console.log('接收到的手机号:', phone);
    
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

    // 尝试主API，失败则使用备用API
    let response;
    try {
      console.log('尝试主API:', `${NETEASE_API_BASE}/captcha/sent`);
      response = await axios.post(`${NETEASE_API_BASE}/captcha/sent`, requestData, { timeout: 15000 });
      console.log('主API发送验证码成功:', { code: response.data.code, message: response.data.message });
    } catch (primaryError: any) {
      console.log('主API失败，尝试备用API:', primaryError.message);
      console.log('主API错误详情:', primaryError.response?.data || primaryError.message);
      
      try {
        console.log('尝试备用API:', `${BACKUP_API_BASE}/captcha/sent`);
        response = await axios.post(`${BACKUP_API_BASE}/captcha/sent`, requestData, { timeout: 15000 });
        console.log('备用API发送验证码成功:', { code: response.data.code, message: response.data.message });
      } catch (backupError: any) {
        console.log('备用API也失败:', backupError.message);
        console.log('备用API错误详情:', backupError.response?.data || backupError.message);
        throw backupError;
      }
    }

    console.log('验证码API完整响应:', response.data);
    console.log('=== 发送验证码请求结束 ===');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('=== 发送验证码最终失败 ===');
    console.error('错误信息:', error.message);
    console.error('错误详情:', error.response?.data || error);
    console.error('错误状态码:', error.response?.status);
    
    res.status(500).json({
      code: 500,
      message: '发送验证码失败',
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

    const response = await axios.get(`${NETEASE_API_BASE}/user/playlist`, {
      params: { uid },
      headers: {
        Cookie: cookie as string
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌单失败:', error.message);
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

    const response = await axios.get(`${NETEASE_API_BASE}/playlist/detail`, {
      params: { id },
      headers: {
        Cookie: cookie as string
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌单详情失败:', error.message);
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
    const { id, br = 320000 } = req.query;
    
    if (!id) {
      res.status(400).json({
        code: 400,
        message: '歌曲ID不能为空'
      });
      return;
    }

    const response = await axios.get(`${NETEASE_API_BASE}/song/url`, {
      params: { id, br }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌曲播放地址失败:', error.message);
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
    const { ids } = req.query;
    
    if (!ids) {
      res.status(400).json({
        code: 400,
        message: '歌曲ID列表不能为空'
      });
      return;
    }

    const response = await axios.get(`${NETEASE_API_BASE}/song/detail`, {
      params: { ids }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('获取歌曲详情失败:', error.message);
    res.status(500).json({
      code: 500,
      message: '获取歌曲详情失败',
      error: error.message
    });
  }
});







export default router;