import { create } from 'zustand';

// 用户信息接口
export interface User {
  id: number;
  nickname: string;
  avatarUrl: string;
  phone: string;
}

// 歌曲信息接口
export interface Song {
  id: number;
  name: string;
  artist: string;
  album: string;
  duration: number;
  url?: string;
  picUrl?: string;
}

// 播放列表接口
export interface Playlist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  description?: string;
}

// 播放状态接口
export interface PlaybackState {
  isPlaying: boolean;
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Song[];
  currentIndex: number;
  isLofiMode: boolean;
}

// 全局状态接口
interface AppState {
  // 用户相关
  user: User | null;
  isLoggedIn: boolean;
  isGuestMode: boolean;
  playlists: Playlist[];
  
  // 播放相关
  playback: PlaybackState;
  
  // UI状态
  currentPage: 'login' | 'desktop' | 'immersive';
  isDesktopMusicPlayerOpen: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setGuestMode: (isGuest: boolean) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setCurrentPage: (page: 'login' | 'desktop' | 'immersive') => void;
  setDesktopMusicPlayerOpen: (isOpen: boolean) => void;
  
  // 播放控制
  setCurrentSong: (song: Song) => void;
  setPlaylist: (playlist: Song[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setCurrentIndex: (index: number) => void;
  setLofiMode: (isLofi: boolean) => void;
  
  // 播放操作
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  
  // 重置状态
  logout: () => void;
}

// 游客模式内置音乐
const guestSongs: Song[] = [
  {
    id: 1,
    name: "千禧复古音乐",
    artist: "演示艺术家",
    album: "复古专辑",
    duration: 240,
    url: "https://m10.music.126.net/20250809232727/be70ce2573695539f95e5fa74e5564cc/ymusic/c48c/fb99/1950/a0634034446f904929e37dc2686ba91b.mp3?vuutv=dK9CJuc9xUQc/KnNp1lWeq2E85IwGe8ovhQAZfo2ezTQCuaSojshTT+wHzE9KGXXWqk3T+KX5DQEqsykuMzJ9AG8f+w+KQCCCmndJq7bXkyK0smEh4mEFxwwbkKuh9fIRmB7R2D077/KT2U5q0qfHXWmyo348Q5IULbJdwAWVw5XkeUHkar06th8gmhy96kx37TmpiYroyvSkqgsRSFi9gAQ/6B8kf547cPbiHYf5ll7Iulgas620P+FE/tBamT7ronUW5AleYKm9zhnLh4yBsWnKzmJR8GfKzHrp0fQ1B6lBI5sjF6Y2Vlte4o1bUo8rWFAgfzByXmhbviO7h7KfOgKtCtnUEGtOV1MtOWgnA8rwICTULyOFONoku/I94N+",
    picUrl: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=retro%20music%20album%20cover%20millennium%20style%20pixel%20art&image_size=square"
  }
];

// 游客模式歌单
const guestPlaylists: Playlist[] = [
  {
    id: 1,
    name: "游客演示歌单",
    coverImgUrl: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=retro%20music%20playlist%20cover%20millennium%20style&image_size=square",
    trackCount: 1,
    description: "游客模式演示歌单"
  }
];

// 初始播放状态
const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentSong: null,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  playlist: [],
  currentIndex: 0,
  isLofiMode: false,
};

// 创建全局状态store
export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  user: null,
  isLoggedIn: false,
  isGuestMode: false,
  playlists: [],
  playback: initialPlaybackState,
  currentPage: 'login',
  isDesktopMusicPlayerOpen: false,
  
  // 用户相关actions
  setUser: (user) => set({ user, isLoggedIn: true, isGuestMode: false }),
  setGuestMode: (isGuest) => set({ 
    isGuestMode: isGuest, 
    isLoggedIn: isGuest,
    user: isGuest ? {
      id: 0,
      nickname: "游客用户",
      avatarUrl: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=guest%20user%20avatar%20retro%20style&image_size=square",
      phone: ""
    } : null,
    playlists: isGuest ? guestPlaylists : [],
    playback: isGuest ? {
      ...initialPlaybackState,
      playlist: guestSongs,
      currentSong: guestSongs[0]
    } : initialPlaybackState
  }),
  setPlaylists: (playlists) => set({ playlists }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setDesktopMusicPlayerOpen: (isOpen) => set({ isDesktopMusicPlayerOpen: isOpen }),
  
  // 播放控制actions
  setCurrentSong: (song) => set((state) => ({
    playback: { ...state.playback, currentSong: song }
  })),
  
  setPlaylist: (playlist) => set((state) => ({
    playback: { ...state.playback, playlist, currentIndex: 0 }
  })),
  
  setIsPlaying: (isPlaying) => set((state) => ({
    playback: { ...state.playback, isPlaying }
  })),
  
  setCurrentTime: (time) => set((state) => ({
    playback: { ...state.playback, currentTime: time }
  })),
  
  setDuration: (duration) => set((state) => ({
    playback: { ...state.playback, duration }
  })),
  
  setVolume: (volume) => set((state) => ({
    playback: { ...state.playback, volume }
  })),
  
  setCurrentIndex: (index) => set((state) => ({
    playback: { ...state.playback, currentIndex: index }
  })),
  
  setLofiMode: (isLofi) => set((state) => ({
    playback: { ...state.playback, isLofiMode: isLofi }
  })),
  
  // 播放操作
  playNext: () => {
    const { playback } = get();
    const nextIndex = (playback.currentIndex + 1) % playback.playlist.length;
    const nextSong = playback.playlist[nextIndex];
    
    set((state) => ({
      playback: {
        ...state.playback,
        currentIndex: nextIndex,
        currentSong: nextSong,
        currentTime: 0
      }
    }));
  },
  
  playPrevious: () => {
    const { playback } = get();
    const prevIndex = playback.currentIndex === 0 
      ? playback.playlist.length - 1 
      : playback.currentIndex - 1;
    const prevSong = playback.playlist[prevIndex];
    
    set((state) => ({
      playback: {
        ...state.playback,
        currentIndex: prevIndex,
        currentSong: prevSong,
        currentTime: 0
      }
    }));
  },
  
  togglePlay: () => {
    const { playback } = get();
    set((state) => ({
      playback: { ...state.playback, isPlaying: !playback.isPlaying }
    }));
  },
  
  // 重置状态
  logout: () => set({
    user: null,
    isLoggedIn: false,
    isGuestMode: false,
    playlists: [],
    playback: initialPlaybackState,
    currentPage: 'login',
    isDesktopMusicPlayerOpen: false,
  }),
}));

// 导出类型
export type { AppState };