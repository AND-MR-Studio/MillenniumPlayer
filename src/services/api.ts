import axios from 'axios';
import { User, Playlist, Song } from '../store/useStore';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

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
    try {
      const response = await api.post('/netease/captcha/sent', {
        phone
      });
      return response.data;
    } catch (error) {
      throw new Error('发送验证码失败');
    }
  },

  // 验证码登录
  loginByCaptcha: async (phone: string, captcha: string): Promise<{ code: number; profile?: User; cookie?: string }> => {
    try {
      const response = await api.post('/netease/login/cellphone', {
        phone,
        captcha
      });
      return response.data;
    } catch (error) {
      throw new Error('验证码登录失败，请检查验证码');
    }
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

export default api;