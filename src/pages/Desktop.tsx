import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Window,
  WindowContent,
  WindowHeader,
  Button,
  Toolbar,
  Panel,
  MenuList,
  MenuListItem,
  Separator,
  Avatar,
  ProgressBar,
  ScrollView
} from 'react95';
import styled from 'styled-components';
import { useStore } from '../store/useStore';
import { neteaseApi, formatPlaylist, formatSong } from '../services/api';
import { audioService } from '../services/audioService';
import CDPlayer from '../components/CDPlayer';

// 桌面容器 - 固定分辨率
const DesktopContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #004040;
  position: relative;
  overflow: hidden;
  font-family: 'Sango-JA-SVG', sans-serif;
`;

// 桌面背景
const DesktopBackground = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #003030 0%, #004040 100%);
  position: relative;
`;

// 任务栏
const Taskbar = styled(Panel)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: #c0c0c0;
  border-top: 2px outset #c0c0c0;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.2);
`;

// 开始按钮
const StartButton = styled(Button)`
  height: 32px;
  padding: 0 16px;
  font-weight: bold;
  margin-right: 8px;
  font-size: 14px;
  background: #c0c0c0;
  border: 2px outset #c0c0c0;
  
  &:active {
    border: 2px inset #c0c0c0;
  }
`;

// 时钟显示
const Clock = styled.div`
  margin-left: auto;
  padding: 4px 8px;
  border: 1px inset #c0c0c0;
  font-size: 12px;
  background: #c0c0c0;
  min-width: 60px;
  text-align: center;
`;

// 桌面图标
const DesktopIcon = styled.div<{ selected?: boolean }>`
  position: absolute;
  width: 80px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 6px;
  border-radius: 2px;
`;

const IconImage = styled.img`
  width: 48px;
  height: 48px;
  margin-bottom: 6px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const IconLabel = styled.div<{ selected?: boolean }>`
  font-size: 12px;
  color: ${props => props.selected ? '#0000ff' : '#ffffff'};
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  word-wrap: break-word;
  line-height: 1.2;
  font-weight: ${props => props.selected ? 'bold' : 'normal'};
  background: ${props => props.selected ? '#ffffff' : 'transparent'};
  padding: ${props => props.selected ? '2px 4px' : '0'};
  border-radius: 2px;
`;

// 音乐播放器窗口
const MusicPlayerWindow = styled(Window)`
  position: absolute;
  top: 50px;
  right: 50px;
  width: 320px;
  height: 240px;
  z-index: 100;
`;

const PlayerContent = styled.div`
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px;
  background: #f0f0f0;
  border: 1px inset #c0c0c0;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 2px;
  margin-right: 8px;
`;

const UserName = styled.div`
  font-size: 12px;
  font-weight: bold;
`;

const PlaylistContainer = styled.div`
  flex: 1;
  border: 1px inset #c0c0c0;
  background: white;
`;

const PlaylistItem = styled.div`
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11px;
  border-bottom: 1px solid #e0e0e0;
  
  &:hover {
    background: #0080ff;
    color: white;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px;
  background: #f0f0f0;
  border: 1px inset #c0c0c0;
`;

const Desktop: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoggedIn,
    playlists,
    playback,
    isDesktopMusicPlayerOpen,
    setPlaylists,
    setDesktopMusicPlayerOpen,
    setCurrentPage,
    setCurrentSong,
    setPlaylist,
    togglePlay,
    logout
  } = useStore();
  
  const [currentTime, setCurrentTime] = useState('');
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistSongs, setPlaylistSongs] = useState<any[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('/');
      return;
    }
    
    // 加载用户歌单
    loadUserPlaylists();
    setCurrentPage('desktop');
  }, [isLoggedIn, user, navigate, setCurrentPage]);

  // 更新时钟
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 加载用户歌单
  const loadUserPlaylists = async () => {
    if (!user) return;
    
    setIsLoadingPlaylists(true);
    try {
      const response = await neteaseApi.getUserPlaylists(user.id);
      if (response.code === 200 && response.playlist) {
        const formattedPlaylists = response.playlist.map(formatPlaylist);
        setPlaylists(formattedPlaylists);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // 加载歌单详情
  const loadPlaylistDetail = async (playlist: any) => {
    try {
      const response = await neteaseApi.getPlaylistDetail(playlist.id);
      if (response.code === 200 && response.playlist?.tracks) {
        const formattedSongs = response.playlist.tracks.map(formatSong);
        setPlaylistSongs(formattedSongs);
        setSelectedPlaylist(playlist);
      }
    } catch (error) {
      console.error('Failed to load playlist detail:', error);
    }
  };

  // 播放歌曲
  const playSong = async (song: any, index: number) => {
    try {
      // 获取歌曲播放地址
      const urlResponse = await neteaseApi.getSongUrl(song.id);
      if (urlResponse.code === 200 && urlResponse.data?.[0]?.url) {
        const songWithUrl = { ...song, url: urlResponse.data[0].url };
        setCurrentSong(songWithUrl);
        setPlaylist(playlistSongs);
        
        // 加载音频
        await audioService.loadAudio(songWithUrl.url);
        await audioService.play();
      }
    } catch (error) {
      console.error('Failed to play song:', error);
    }
  };

  // 桌面图标配置
  const desktopIcons = [
    { id: 'mycomputer', icon: '/我的电脑.png', label: '我的电脑', x: 20, y: 20, action: () => {} },
    { id: 'network', icon: '/W95-1  (60).png', label: '网上邻居', x: 20, y: 120, action: () => {} },
    { id: 'music', icon: '/CD播放.png', label: '音乐播放器', x: 20, y: 220, action: () => setDesktopMusicPlayerOpen(true) },
    { id: 'immersive', icon: '/W95-1  (92).png', label: '沉浸模式', x: 20, y: 320, action: () => navigate('/immersive') },
    { id: 'recycle', icon: '/回收站.png', label: '回收站', x: 20, y: 420, action: () => {} },
    { id: 'settings', icon: '/W95-1  (60).png', label: '设置', x: 120, y: 20, action: () => {} },
    { id: 'logout', icon: '/W95-1  (92).png', label: '注销', x: 120, y: 120, action: logout }
  ];

  return (
    <DesktopContainer>
      <DesktopBackground>
        {/* 桌面图标 */}
        {desktopIcons.map(icon => (
          <DesktopIcon
            key={icon.id}
            style={{ left: icon.x, top: icon.y }}
            selected={selectedIcon === icon.id}
            onClick={() => {
              setSelectedIcon(icon.id);
              setTimeout(() => {
                icon.action();
                setSelectedIcon(null);
              }, 200);
            }}
          >
            <IconImage src={icon.icon} alt={icon.label} />
            <IconLabel selected={selectedIcon === icon.id}>{icon.label}</IconLabel>
          </DesktopIcon>
        ))}

        {/* CD播放器窗口 */}
        {isDesktopMusicPlayerOpen && (
          <div style={{ position: 'absolute', top: '50px', right: '50px', zIndex: 100 }}>
            <CDPlayer onClose={() => setDesktopMusicPlayerOpen(false)} />
          </div>
        )}

        {/* 任务栏 */}
        <Taskbar>
          <StartButton>开始</StartButton>
          <Clock>{currentTime}</Clock>
        </Taskbar>
      </DesktopBackground>
    </DesktopContainer>
  );
};

export default Desktop;