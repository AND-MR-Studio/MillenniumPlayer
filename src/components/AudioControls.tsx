import React, { useState, useEffect } from 'react';
import { Button, Panel, Slider, Checkbox } from 'react95';
import { audioService } from '../services/audioService';
import { useStore } from '../store/useStore';

interface AudioControlsProps {
  className?: string;
  style?: React.CSSProperties;
}

const AudioControls: React.FC<AudioControlsProps> = ({ className, style }) => {
  const { 
    playback,
    setIsPlaying, 
    setVolume, 
    setLofiMode 
  } = useStore();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lofiIntensity, setLofiIntensity] = useState(0.5);
  const [testAudioUrl, setTestAudioUrl] = useState('');

  // 更新播放时间
  useEffect(() => {
    const interval = setInterval(() => {
      if (playback.isPlaying) {
        setCurrentTime(audioService.getCurrentTime());
        setDuration(audioService.getDuration());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playback.isPlaying]);

  // 处理播放/暂停
  const handlePlayPause = async () => {
    try {
      if (playback.isPlaying) {
        audioService.pause();
        setIsPlaying(false);
      } else {
        await audioService.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('播放控制失败:', error);
    }
  };

  // 处理音量变化
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume / 100);
    audioService.setVolume(newVolume / 100);
  };

  // 处理Lofi模式切换
  const handleLofiToggle = (enabled: boolean) => {
    setLofiMode(enabled);
    audioService.toggleLofiMode(enabled);
  };

  // 处理Lofi强度调整
  const handleLofiIntensityChange = (intensity: number) => {
    setLofiIntensity(intensity);
    audioService.setLofiIntensity(intensity / 100);
  };

  // 加载测试音频
  const handleLoadTestAudio = async () => {
    if (!testAudioUrl) {
      alert('请输入音频URL');
      return;
    }

    try {
      await audioService.loadAudio(testAudioUrl);
      alert('音频加载成功！');
    } catch (error) {
      alert('音频加载失败: ' + error);
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Panel variant='well' className={className} style={{ padding: '15px', ...style }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>音频控制面板</h3>
      
      {/* 当前歌曲信息 */}
      {playback.currentSong && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#c0c0c0', border: '1px inset #c0c0c0' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{playback.currentSong.name}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>{playback.currentSong.artist}</div>
          <div style={{ fontSize: '10px', marginTop: '5px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}
      
      {/* 测试音频加载 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>测试音频URL:</label>
        <input
          type="text"
          value={testAudioUrl}
          onChange={(e) => setTestAudioUrl(e.target.value)}
          placeholder="输入音频文件URL"
          style={{ 
            width: '100%', 
            padding: '2px 4px', 
            fontSize: '11px',
            marginBottom: '5px',
            border: '1px inset #c0c0c0'
          }}
        />
        <Button onClick={handleLoadTestAudio} size='sm'>
          加载音频
        </Button>
      </div>
      
      {/* 播放控制 */}
      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        <Button 
          onClick={handlePlayPause}
          style={{ minWidth: '80px', marginRight: '10px' }}
        >
          {playback.isPlaying ? '暂停' : '播放'}
        </Button>
        <Button 
          onClick={() => audioService.stop()}
          style={{ minWidth: '80px' }}
        >
          停止
        </Button>
      </div>
      
      {/* 音量控制 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>音量: {Math.round(playback.volume * 100)}%</label>
        <Slider
          value={Math.round(playback.volume * 100)}
          onChange={handleVolumeChange}
          min={0}
          max={100}
          step={1}
        />
      </div>
      
      {/* Lofi模式控制 */}
      <div style={{ marginBottom: '15px' }}>
        <Checkbox
          checked={playback.isLofiMode}
          onChange={(e) => handleLofiToggle(e.target.checked)}
          label="启用Lofi模式"
        />
      </div>
      
      {/* Lofi强度控制 */}
      {playback.isLofiMode && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>Lofi强度: {lofiIntensity}%</label>
          <Slider
            value={lofiIntensity * 100}
            onChange={handleLofiIntensityChange}
            min={0}
            max={100}
            step={1}
          />
        </div>
      )}
      
      {/* 音频效果说明 */}
      <div style={{ fontSize: '10px', color: '#666', marginTop: '15px' }}>
        <strong>Lofi效果包括:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
          <li>位深度压缩 (BitCrusher)</li>
          <li>磁带饱和度 (Distortion)</li>
          <li>合唱效果 (Chorus)</li>
          <li>颤音效果 (Tremolo)</li>
          <li>混响 (Reverb)</li>
          <li>频率滤波 (EQ)</li>
          <li>背景噪音 (Pink Noise)</li>
        </ul>
      </div>
    </Panel>
  );
};

export default AudioControls;