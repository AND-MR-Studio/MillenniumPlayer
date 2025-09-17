import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Slider } from 'react95';
import { useStore } from '../store/useStore';
import { audioService, AudioEffects } from '../services/audioService';
import TunnelTransition from './TunnelTransition';

// 自定义Slider包装器，避免React95警告
const CustomSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  style?: React.CSSProperties;
}> = ({ value, min, max, step, onChange, style }) => {
  return (
    <Slider
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      style={style}
    />
  );
};

// CD播放器主容器
const CDPlayerContainer = styled.div`
  width: 400px;
  height: 420px;
  background: #c0c0c0;
  border: 2px outset #c0c0c0;
  position: relative;
  font-family: 'MS Sans Serif', sans-serif;
  font-size: 11px;
`;

// 标题栏
const TitleBar = styled.div`
  height: 20px;
  background: linear-gradient(90deg, #0080ff 0%, #4080ff 100%);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-weight: bold;
  font-size: 11px;
`;

// 标题图标
const TitleIcon = styled.img`
  width: 16px;
  height: 16px;
  margin-right: 4px;
`;

// 窗口控制按钮
const WindowControls = styled.div`
  margin-left: auto;
  display: flex;
  gap: 2px;
`;

const ControlButton = styled.button`
  width: 16px;
  height: 14px;
  background: #c0c0c0;
  border: 1px outset #c0c0c0;
  font-size: 8px;
  cursor: pointer;
  
  &:active {
    border: 1px inset #c0c0c0;
  }
`;

// 主内容区域
const PlayerContent = styled.div`
  padding: 8px;
  height: calc(100% - 20px);
  display: flex;
  gap: 8px;
`;

// 专辑封面区域
const AlbumCoverArea = styled.div`
  width: 180px;
  height: 180px;
  background: #000;
  border: 2px inset #c0c0c0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const AlbumCover = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoAlbumText = styled.div`
  color: #666;
  font-size: 12px;
  text-align: center;
`;

// 控制面板区域
const ControlPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// 下拉菜单容器
const DropdownContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DropdownLabel = styled.label`
  font-size: 11px;
  min-width: 40px;
`;

const Dropdown = styled.select`
  flex: 1;
  height: 20px;
  background: white;
  border: 1px inset #c0c0c0;
  font-size: 11px;
  padding: 1px 16px 1px 2px;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 2px center;
  background-size: 12px;
`;

// 进度条区域
const ProgressArea = styled.div`
  margin: 16px 0;
`;

// 音效调节区域
const AudioEffectsArea = styled.div`
  margin: 12px 0;
  padding: 8px;
  background: #f0f0f0;
  border: 1px inset #c0c0c0;
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const EffectsTitle = styled.div`
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #000080;
`;

const EffectRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
`;

const EffectLabel = styled.label`
  font-size: 10px;
  min-width: 50px;
  max-width: 50px;
  color: #333;
  flex-shrink: 0;
`;

const SliderContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  max-width: 120px;
  overflow: hidden;
`;

const EffectValue = styled.span`
  font-size: 10px;
  min-width: 35px;
  max-width: 35px;
  text-align: right;
  color: #666;
  flex-shrink: 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: #c0c0c0;
  border: 1px inset #c0c0c0;
  position: relative;
  cursor: pointer;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #0080ff, #4080ff);
  transition: width 0.1s ease;
`;

const ProgressHandle = styled.div<{ position: number }>`
  position: absolute;
  top: -2px;
  left: ${props => props.position}%;
  width: 12px;
  height: 24px;
  background: #c0c0c0;
  border: 1px outset #c0c0c0;
  cursor: grab;
  transform: translateX(-50%);
  
  &:active {
    cursor: grabbing;
    border: 1px inset #c0c0c0;
  }
`;

// 播放控制按钮区域
const PlayControls = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: auto;
`;

const PlayButton = styled.button`
  width: 32px;
  height: 24px;
  background: #c0c0c0;
  border: 1px outset #c0c0c0;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    border: 1px inset #c0c0c0;
  }
  
  &:disabled {
    color: #666;
    cursor: not-allowed;
  }
`;

const VolumeButton = styled(PlayButton)`
  width: 24px;
  border-radius: 50%;
  margin-left: auto;
`;

interface CDPlayerProps {
  onClose: () => void;
}

// 过渡覆盖层
const TransitionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
`;

/**
 * CD播放器组件 - 模拟经典Win95风格的CD播放器界面
 * @param onClose 关闭播放器的回调函数
 */
const CDPlayer: React.FC<CDPlayerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { playback, playlists, setCurrentSong, setIsPlaying, togglePlay, setCurrentIndex } = useStore();
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  
  // 默认音效参数
  const defaultAudioEffects: AudioEffects = {
    speed: 100,           // 播放速度 (25-200)
    lowpass: 8000,        // 低通滤波 (1000-20000 Hz)
    highpass: 80,         // 高通滤波 (20-500 Hz)
    noise: 20,            // 白噪音强度 (0-100)
    reverb: 20,           // 混响强度 (0-100)
    spatial: 0,           // 3D空间音效 (0-100)
    warmth: 30,           // 温暖度 (0-100)
    saturation: 20,       // 饱和度 (0-100)
    vocalSuppression: 0,  // 人声抑制 (0-100)
    stereoWidth: 50,      // 立体声宽度 (0-100)
    asmrMode: false,      // ASMR模式
    noiseType: 'pink'     // 噪音类型
  };

  // 音效状态
  const [audioEffects, setAudioEffects] = useState<AudioEffects>(defaultAudioEffects);

  // 获取所有艺术家列表
  const artists = Array.from(new Set(playback.playlist.map(song => song.artist)));
  
  // 根据选中的艺术家获取曲目列表
  const tracks = selectedArtist 
    ? playback.playlist.filter(song => song.artist === selectedArtist)
    : [];

  // 更新播放进度
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (playback.isPlaying && !isDragging) {
      intervalId = setInterval(() => {
        const currentTime = audioService.getCurrentTime();
        const duration = audioService.getDuration();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }, 100); // 每100ms更新一次进度
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [playback.isPlaying, isDragging]);

  // 初始化音效设置
  useEffect(() => {
    // 在组件加载时应用默认音效设置
    audioService.updateAudioEffects(audioEffects);
  }, []);

  /**
   * 处理音效参数变化
   * @param effectType 音效类型
   * @param value 新的数值
   */
  const handleEffectChange = (effectType: keyof AudioEffects, value: number | string | boolean) => {
    const newEffects = {
      ...audioEffects,
      [effectType]: value
    };
    
    setAudioEffects(newEffects);
    
    // 立即应用音效
    audioService.updateAudioEffects(newEffects);
  };

  /**
   * 重置音效参数
   */
  const resetAudioEffects = () => {
    setAudioEffects(defaultAudioEffects);
    audioService.updateAudioEffects(defaultAudioEffects);
  };

  // 初始化当前歌曲的艺术家和曲目选择
  useEffect(() => {
    if (playback.currentSong) {
      setSelectedArtist(playback.currentSong.artist);
      setSelectedTrack(playback.currentSong.name);
    } else if (playback.playlist.length > 0 && !playback.currentSong) {
      // 如果没有当前歌曲但有播放列表，自动选择第一首歌曲
      const firstSong = playback.playlist[0];
      setCurrentSong(firstSong);
      setCurrentIndex(0);
      setSelectedArtist(firstSong.artist);
      setSelectedTrack(firstSong.name);
      console.log('自动选择第一首歌曲:', firstSong.name);
    }
  }, [playback.currentSong, playback.playlist, setCurrentSong, setCurrentIndex]);

  // 处理艺术家选择
  const handleArtistChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const artist = event.target.value;
    setSelectedArtist(artist);
    setSelectedTrack(''); // 重置曲目选择
  };

  // 处理曲目选择
  const handleTrackChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const trackName = event.target.value;
    setSelectedTrack(trackName);
    
    // 查找并播放选中的歌曲
    const songIndex = playback.playlist.findIndex(s => s.name === trackName && s.artist === selectedArtist);
    if (songIndex !== -1) {
      const song = playback.playlist[songIndex];
      console.log('准备播放歌曲:', song.name, '路径:', song.url);
      setCurrentSong(song);
      setCurrentIndex(songIndex);
      
      if (song.url) {
        audioService.loadAudio(song.url).then(() => {
          console.log('音频加载成功，应用音效设置');
          // 应用当前音效设置
          audioService.updateAudioEffects(audioEffects);
          console.log('Audio effects applied after loading song:', song.name);
          console.log('开始播放');
          audioService.play();
          setIsPlaying(true);
        }).catch(error => {
          console.error('播放歌曲失败:', error);
          alert('播放失败: ' + error.message);
        });
      } else {
        console.error('歌曲URL为空');
        alert('歌曲文件路径不存在');
      }
    }
  };

  // 处理进度条点击
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    const duration = audioService.getDuration();
    
    if (duration > 0) {
      const newTime = (newProgress / 100) * duration;
      audioService.setCurrentTime(newTime);
      setProgress(newProgress);
    }
  };

  // 播放控制函数
  const handlePrevious = () => {
    if (playback.currentIndex > 0) {
      const newIndex = playback.currentIndex - 1;
      const prevSong = playback.playlist[newIndex];
      console.log('切换到上一首:', prevSong.name);
      setCurrentSong(prevSong);
      setCurrentIndex(newIndex);
      
      if (prevSong.url) {
        audioService.loadAudio(prevSong.url).then(() => {
          // 应用当前音效设置
          audioService.updateAudioEffects(audioEffects);
          console.log('Audio effects applied after loading previous song');
          audioService.play();
          setIsPlaying(true);
        }).catch(error => {
          console.error('播放上一首失败:', error);
        });
      }
    }
  };

  const handleNext = () => {
    if (playback.currentIndex < playback.playlist.length - 1) {
      const newIndex = playback.currentIndex + 1;
      const nextSong = playback.playlist[newIndex];
      console.log('切换到下一首:', nextSong.name);
      setCurrentSong(nextSong);
      setCurrentIndex(newIndex);
      
      if (nextSong.url) {
        audioService.loadAudio(nextSong.url).then(() => {
          // 应用当前音效设置
          audioService.updateAudioEffects(audioEffects);
          console.log('Audio effects applied after loading next song');
          audioService.play();
          setIsPlaying(true);
        }).catch(error => {
          console.error('播放下一首失败:', error);
        });
      }
    }
  };

  const handleStop = () => {
    audioService.stop();
    setIsPlaying(false);
  };

  /**
   * 处理播放按钮点击 - 播放音乐并进入沉浸模式
   */
  const handlePlayClick = () => {
    if (!playback.isPlaying) {
      // 如果当前没有播放，先播放音乐
      if (playback.currentSong && playback.currentSong.url) {
        audioService.loadAudio(playback.currentSong.url)
          .then(() => {
            console.log('音频加载成功，应用音效设置');
            // 应用当前音效设置
            audioService.updateAudioEffects(audioEffects);
            console.log('开始播放');
            return audioService.play();
          })
          .then(() => {
            setIsPlaying(true);
            // 延迟一下确保音乐开始播放，然后显示过渡动画进入沉浸模式
            setTimeout(() => {
              setShowTransition(true);
            }, 500);
          })
          .catch(error => {
            console.error('播放歌曲失败:', error);
            alert('播放失败: ' + error.message);
          });
      } else {
        console.error('没有可播放的歌曲');
        alert('请先选择一首歌曲');
      }
    } else {
      // 如果正在播放，直接显示过渡动画进入沉浸模式
      setShowTransition(true);
    }
  };

  // 过渡完成后进入沉浸模式
  const handleTransitionComplete = () => {
    setShowTransition(false);
    navigate('/immersive');
  };

  return (
    <>
      <CDPlayerContainer>
      <TitleBar>
        <TitleIcon src="/CD播放.png" alt="CD Player" />
        CD Player
        <WindowControls>
          <ControlButton>−</ControlButton>
          <ControlButton>□</ControlButton>
          <ControlButton onClick={onClose}>×</ControlButton>
        </WindowControls>
      </TitleBar>
      
      <PlayerContent>
        {/* 专辑封面区域 */}
        <AlbumCoverArea>
          {playback.currentSong?.picUrl ? (
            <AlbumCover src={playback.currentSong.picUrl} alt="Album Cover" />
          ) : (
            <NoAlbumText>No Album Art</NoAlbumText>
          )}
        </AlbumCoverArea>
        
        {/* 控制面板 */}
        <ControlPanel>
          {/* 艺术家选择 */}
          <DropdownContainer>
            <DropdownLabel>Artist:</DropdownLabel>
            <Dropdown value={selectedArtist} onChange={handleArtistChange}>
              <option value="">{'<D:>'}</option>
              {artists.map(artist => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </Dropdown>
          </DropdownContainer>
          
          {/* 曲目选择 */}
          <DropdownContainer>
            <DropdownLabel>Track:</DropdownLabel>
            <Dropdown value={selectedTrack} onChange={handleTrackChange}>
              <option value="">{'<D:>'}</option>
              {tracks.map(track => (
                <option key={track.id} value={track.name}>{track.name}</option>
              ))}
            </Dropdown>
          </DropdownContainer>
          
          {/* 进度条 */}
          <ProgressArea>
            <ProgressBar onClick={handleProgressClick}>
              <ProgressFill progress={progress} />
              <ProgressHandle position={progress} />
            </ProgressBar>
          </ProgressArea>
          
          {/* 音效调节区域 */}
          <AudioEffectsArea>
            <EffectsTitle>LoFi 音效调节</EffectsTitle>
            
            <EffectRow>
              <EffectLabel>速度:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.speed}
                  min={25}
                  max={200}
                  step={5}
                  onChange={(value) => handleEffectChange('speed', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.speed}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>低通:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.lowpass}
                  min={1000}
                  max={20000}
                  step={500}
                  onChange={(value) => handleEffectChange('lowpass', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.lowpass}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>高通:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.highpass}
                  min={20}
                  max={500}
                  step={10}
                  onChange={(value) => handleEffectChange('highpass', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.highpass}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>噪音:</EffectLabel>
              <SliderContainer>
                <select
                  value={audioEffects.noiseType}
                  onChange={(e) => handleEffectChange('noiseType', e.target.value as 'white' | 'pink' | 'brown')}
                  style={{ 
                    width: '50px', 
                    fontSize: '10px',
                    backgroundColor: '#c0c0c0',
                    border: '1px inset #c0c0c0',
                    marginRight: '4px'
                  }}
                >
                  <option value="white">白</option>
                  <option value="pink">粉</option>
                  <option value="brown">棕</option>
                </select>
                <CustomSlider
                  value={audioEffects.noise}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) => handleEffectChange('noise', value)}
                  style={{ width: '60px' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.noise}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>混响:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.reverb}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) => handleEffectChange('reverb', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.reverb}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>温暖:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.warmth}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) => handleEffectChange('warmth', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.warmth}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>饱和:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.saturation}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) => handleEffectChange('saturation', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.saturation}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>人声:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.vocalSuppression}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) => handleEffectChange('vocalSuppression', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.vocalSuppression}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>宽度:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.stereoWidth}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) => handleEffectChange('stereoWidth', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.stereoWidth}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>3D音效:</EffectLabel>
              <SliderContainer>
                <CustomSlider
                  value={audioEffects.spatial}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) => handleEffectChange('spatial', value)}
                  style={{ width: '100%' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.spatial}%</EffectValue>
            </EffectRow>
            
            <EffectRow>
              <EffectLabel>ASMR:</EffectLabel>
              <SliderContainer>
                <input
                  type="checkbox"
                  checked={audioEffects.asmrMode}
                  onChange={(e) => handleEffectChange('asmrMode', e.target.checked)}
                  style={{ width: 'auto' }}
                />
              </SliderContainer>
              <EffectValue>{audioEffects.asmrMode ? '开' : '关'}</EffectValue>
            </EffectRow>
            
            {/* 重置按钮 */}
            <EffectRow style={{ marginTop: '8px', justifyContent: 'center' }}>
              <PlayButton 
                onClick={resetAudioEffects}
                title="重置所有音效为默认值"
                style={{ width: '80px', fontSize: '10px' }}
              >
                重置音效
              </PlayButton>
            </EffectRow>
          </AudioEffectsArea>
          
          {/* 播放控制按钮 */}
          <PlayControls>
            <PlayButton 
              onClick={handlePrevious} 
              title="Previous"
              disabled={playback.currentIndex <= 0}
            >
              ⏮
            </PlayButton>
            <PlayButton onClick={handlePlayClick} title={playback.isPlaying ? "进入沉浸模式" : "播放并进入沉浸模式"}>
              {playback.isPlaying ? '🎵' : '▶'}
            </PlayButton>
            {playback.isPlaying && (
              <PlayButton onClick={togglePlay} title="暂停">
                ⏸
              </PlayButton>
            )}
            <PlayButton 
              onClick={handleNext} 
              title="Next"
              disabled={playback.currentIndex >= playback.playlist.length - 1}
            >
              ⏭
            </PlayButton>
            <PlayButton onClick={handleStop} title="Stop">
              ⏹
            </PlayButton>
            <VolumeButton title="Volume">
              🔊
            </VolumeButton>
          </PlayControls>
        </ControlPanel>
      </PlayerContent>
    </CDPlayerContainer>
    
    {/* 隧道过渡效果 */}
    {showTransition && (
      <TransitionOverlay>
        <TunnelTransition onComplete={handleTransitionComplete} />
      </TransitionOverlay>
    )}
    </>
  );
};

export default CDPlayer;