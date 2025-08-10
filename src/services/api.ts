import axios from 'axios';
import { User, Playlist, Song } from '../store/useStore';

// Cookie管理
class CookieManager {
  private static COOKIE_KEY = 'netease_cookie';
  
  static getCookie(): string | null {
    return localStorage.getItem(this.COOKIE_KEY);
  }
  
  static setCookie(cookie: string): void {
    localStorage.setItem(this.COOKIE_KEY, cookie);
  }
  
  static clearCookie(): void {
    localStorage.removeItem(this.COOKIE_KEY);
  }
}

// 错误处理类
class ApiErrorHandler {
  static handle8810Error(): string {
    return '当前网络环境存在安全风险，建议：\n1. 稍后重试\n2. 更换网络环境\n3. 使用移动网络';
  }
  
  static getErrorMessage(error: any): string {
    if (error.response?.data?.code === 8810) {
      return this.handle8810Error();
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    return error.message || '网络请求失败';
  }
}

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 自动添加cookie到请求中
    const cookie = CookieManager.getCookie();
    if (cookie && config.data && typeof config.data === 'object') {
      config.data.cookie = cookie;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 自动保存返回的cookie
    if (response.data?.cookie) {
      CookieManager.setCookie(response.data.cookie);
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // 特殊处理8810错误
    if (error.response?.data?.code === 8810) {
      console.warn('检测到网络安全风险错误8810');
    }
    
    return Promise.reject(error);
  }
);

// 重试机制
const retryRequest = async <T>(requestFn: () => Promise<T>, maxRetries: number = 2): Promise<T> => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // 如果是8810错误，不进行重试
      if (error.response?.data?.code === 8810) {
        throw error;
      }
      
      // 最后一次重试失败，抛出错误
      if (i === maxRetries) {
        throw error;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError;
};

// 网易云音乐API接口
export const neteaseApi = {
  // 用户登录
  login: async (phone: string, password: string): Promise<{ code: number; profile?: User; cookie?: string }> => {
    try {
      const response = await api.post('/netease/login/cellphone', {
        phone,
        password
      });
      return response.data;
    } catch (error) {
      throw new Error('登录失败，请检查手机号和密码');
    }
  },

  // 发送验证码
  sendCaptcha: async (phone: string): Promise<{ code: number }> => {
    return retryRequest(async () => {
      try {
        const response = await api.post('/netease/captcha/sent', {
          phone
        });
        return response.data;
      } catch (error: any) {
        throw new Error(ApiErrorHandler.getErrorMessage(error));
      }
    });
  },

  // 验证码登录
  loginByCaptcha: async (phone: string, captcha: string): Promise<{ code: number; profile?: User; cookie?: string }> => {
    return retryRequest(async () => {
      try {
        const response = await api.post('/netease/login/cellphone', {
          phone,
          captcha
        });
        
        // 保存登录cookie
        if (response.data.cookie) {
          CookieManager.setCookie(response.data.cookie);
        }
        
        return response.data;
      } catch (error: any) {
        throw new Error(ApiErrorHandler.getErrorMessage(error));
      }
    });
  },

  // 获取用户歌单
  getUserPlaylists: async (uid: number): Promise<{ code: number; playlist?: Playlist[] }> => {
    try {
      const response = await api.get(`/netease/user/playlist?uid=${uid}`);
      return response.data;
    } catch (error) {
      throw new Error('获取歌单失败');
    }
  },

  // 获取歌单详情
  getPlaylistDetail: async (id: number): Promise<{ code: number; playlist?: { tracks: Song[] } }> => {
    try {
      const response = await api.get(`/netease/playlist/detail?id=${id}`);
      return response.data;
    } catch (error) {
      throw new Error('获取歌单详情失败');
    }
  },

  // 获取歌曲播放地址
  getSongUrl: async (id: number): Promise<{ code: number; data?: Array<{ url: string }> }> => {
    try {
      const response = await api.get(`/netease/song/url?id=${id}`);
      return response.data;
    } catch (error) {
      throw new Error('获取歌曲播放地址失败');
    }
  },

  // 获取歌曲详情
  getSongDetail: async (ids: string): Promise<{ code: number; songs?: Song[] }> => {
    try {
      const response = await api.get(`/netease/song/detail?ids=${ids}`);
      return response.data;
    } catch (error) {
      throw new Error('获取歌曲详情失败');
    }
  },

  // 搜索歌曲
  searchSongs: async (keywords: string, limit: number = 30): Promise<{ code: number; result?: { songs: Song[] } }> => {
    try {
      const response = await api.get(`/netease/search?keywords=${encodeURIComponent(keywords)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error('搜索歌曲失败');
    }
  },

  // 检查登录状态
  checkLoginStatus: async (cookie?: string): Promise<{ code: number; data?: any }> => {
    try {
      const cookieToUse = cookie || CookieManager.getCookie();
      const response = await api.post('/netease/login/status', {
        cookie: cookieToUse
      });
      return response.data;
    } catch (error: any) {
      throw new Error(ApiErrorHandler.getErrorMessage(error));
    }
  },

  // 刷新登录状态
  refreshLogin: async (cookie?: string): Promise<{ code: number; cookie?: string }> => {
    try {
      const cookieToUse = cookie || CookieManager.getCookie();
      if (!cookieToUse) {
        throw new Error('没有可用的登录信息');
      }
      
      const response = await api.post('/netease/login/refresh', {
        cookie: cookieToUse
      });
      
      // 更新cookie
      if (response.data.cookie) {
        CookieManager.setCookie(response.data.cookie);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(ApiErrorHandler.getErrorMessage(error));
    }
  },

};

// 工具函数：格式化时间
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 工具函数：格式化歌曲信息
export const formatSong = (song: any): Song => {
  return {
    id: song.id,
    name: song.name,
    artist: song.ar ? song.ar.map((a: any) => a.name).join(', ') : song.artists?.map((a: any) => a.name).join(', ') || '未知艺术家',
    album: song.al?.name || song.album?.name || '未知专辑',
    duration: Math.floor((song.dt || song.duration || 0) / 1000),
    picUrl: song.al?.picUrl || song.album?.picUrl,
  };
};

// 工具函数：格式化歌单信息
export const formatPlaylist = (playlist: any): Playlist => {
  return {
    id: playlist.id,
    name: playlist.name,
    coverImgUrl: playlist.coverImgUrl,
    trackCount: playlist.trackCount,
    description: playlist.description,
  };
};

// 工具函数：格式化用户信息
export const formatUser = (profile: any): User => {
  return {
    id: profile.userId,
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl,
    phone: profile.phone || '',
  };
};

// 导出Cookie管理器
export { CookieManager };

export default api;