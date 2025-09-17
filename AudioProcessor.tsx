import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WindowFrame, Win98Button, Win98Slider, FileUpload } from '../components';
import { MusicNoiseProcessor } from '../lib/musicNoiseProcessor';
import { usePlayerStore } from '../store/playerStore';
import styles from './AudioProcessor.module.css';

/**
 * 音频处理页面组件
 * 提供音乐文件噪音化处理功能
 */
const AudioProcessor: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoiseType, setCurrentNoiseType] = useState<'white' | 'pink' | 'brown'>('pink');
  const [volume, setVolume] = useState(50); // 0-100
  const [filterFrequency, setFilterFrequency] = useState(2000); // Hz
  const [processingIntensity, setProcessingIntensity] = useState(30); // 0-100
  const [playbackRate, setPlaybackRate] = useState(100); // 25-200 (对应0.25-2.0)
  const [lowCutFreq, setLowCutFreq] = useState(80); // 20-500 Hz
  const [highCutFreq, setHighCutFreq] = useState(8000); // 1000-20000 Hz
  const [warmth, setWarmth] = useState(30); // 0-100
  const [saturation, setSaturation] = useState(20); // 0-100
  const [vocalSuppression, setVocalSuppression] = useState(0); // 0-100
  const [spatialIntensity, setSpatialIntensity] = useState(0); // 0-100
  const [asmrMode, setAsmrMode] = useState(false);
  const [reverbAmount, setReverbAmount] = useState(20); // 0-100
  const [stereoWidth, setStereoWidth] = useState(50); // 0-100
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [urlInputValue, setUrlInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioSource, setAudioSource] = useState<'file' | 'url'>('file');
  const musicProcessorRef = useRef<MusicNoiseProcessor | null>(null);
  const { addTrack } = usePlayerStore();

  // 初始化音乐噪音处理器
  useEffect(() => {
    musicProcessorRef.current = new MusicNoiseProcessor();
    
    return () => {
      if (musicProcessorRef.current) {
        musicProcessorRef.current.dispose();
      }
    };
  }, []);

  /**
   * 处理文件上传
   */
  const handleFileUpload = useCallback(async (file: File) => {
    if (!musicProcessorRef.current) return;

    setUploadedFile(file);
    setAudioUrl('');
    setAudioSource('file');
    setIsLoading(true);

    try {
      await musicProcessorRef.current.loadAudioFile(file);
      console.log('音频文件加载成功:', file.name);
    } catch (error) {
      console.error('音频文件加载失败:', error);
      alert('音频文件加载失败，请确保文件格式正确');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 处理URL音频加载
   */
  const handleUrlLoad = useCallback(async () => {
    if (!musicProcessorRef.current || !urlInputValue.trim()) return;

    const url = urlInputValue.trim();
    setIsLoading(true);

    try {
      await musicProcessorRef.current.loadAudioFromUrl(url);
      setAudioUrl(url);
      setUploadedFile(null);
      setAudioSource('url');
      console.log('URL音频加载成功:', url);
    } catch (error) {
      console.error('URL音频加载失败:', error);
      alert(`URL音频加载失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  }, [urlInputValue]);

  /**
   * 处理URL输入变化
   */
  const handleUrlInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInputValue(e.target.value);
  }, []);

  /**
   * 开始/停止播放处理后的音乐
   */
  const toggleProcessedMusic = useCallback(async () => {
    if (!musicProcessorRef.current) return;

    const state = musicProcessorRef.current.getPlaybackState();
    
    if (!state.hasAudioLoaded) {
      alert('请先上传音频文件');
      return;
    }

    if (isPlaying) {
      musicProcessorRef.current.stopProcessedMusic();
      setIsPlaying(false);
    } else {
      try {
        await musicProcessorRef.current.startProcessedMusic();
        setIsPlaying(true);
      } catch (error) {
        console.error('播放处理后音乐失败:', error);
        alert('播放失败，请重试');
      }
    }
  }, [isPlaying]);

  /**
   * 切换噪音类型
   */
  const changeNoiseType = useCallback((noiseType: 'white' | 'pink' | 'brown') => {
    if (!musicProcessorRef.current) return;

    setCurrentNoiseType(noiseType);
    musicProcessorRef.current.setNoiseType(noiseType);
  }, []);

  /**
   * 调整音量
   */
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setVolume(newVolume / 100);
    }
  }, []);

  /**
   * 调整滤波器频率
   */
  const handleFilterChange = useCallback((frequency: number) => {
    setFilterFrequency(frequency);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setFilterFrequency(frequency);
    }
  }, []);

  /**
   * 调整处理强度
   */
  const handleIntensityChange = useCallback((intensity: number) => {
    setProcessingIntensity(intensity);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setProcessingIntensity(intensity / 100);
    }
  }, []);

  /**
   * 调整播放速度
   */
  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setPlaybackRate(rate / 100);
    }
  }, []);

  /**
   * 调整低频截止频率
   */
  const handleLowCutChange = useCallback((frequency: number) => {
    setLowCutFreq(frequency);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setLowCutFrequency(frequency);
    }
  }, []);

  /**
   * 调整高频截止频率
   */
  const handleHighCutChange = useCallback((frequency: number) => {
    setHighCutFreq(frequency);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setHighCutFrequency(frequency);
    }
  }, []);

  /**
   * 调整温暖度
   */
  const handleWarmthChange = useCallback((warmthValue: number) => {
    setWarmth(warmthValue);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setWarmth(warmthValue / 100);
    }
  }, []);

  /**
   * 调整饱和度
   */
  const handleSaturationChange = useCallback((saturationValue: number) => {
    setSaturation(saturationValue);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setSaturation(saturationValue / 100);
    }
  }, []);

  /**
   * 调整人声抑制强度
   */
  const handleVocalSuppressionChange = useCallback((intensity: number) => {
    setVocalSuppression(intensity);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setVocalSuppressionIntensity(intensity / 100);
    }
  }, []);

  /**
   * 调整3D空间音频强度
   */
  const handleSpatialIntensityChange = useCallback((intensity: number) => {
    setSpatialIntensity(intensity);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setSpatialIntensity(intensity / 100);
    }
  }, []);

  /**
   * 切换ASMR模式
   */
  const handleAsmrModeToggle = useCallback(() => {
    const newMode = !asmrMode;
    setAsmrMode(newMode);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setAsmrMode(newMode);
    }
  }, [asmrMode]);

  /**
   * 调整混响量
   */
  const handleReverbAmountChange = useCallback((amount: number) => {
    setReverbAmount(amount);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setReverbAmount(amount / 100);
    }
  }, []);

  /**
   * 调整立体声宽度
   */
  const handleStereoWidthChange = useCallback((width: number) => {
    setStereoWidth(width);
    if (musicProcessorRef.current) {
      musicProcessorRef.current.setStereoWidth(width / 100);
    }
  }, []);

  /**
   * 保存当前设置为播放列表项
   */
  const saveToPlaylist = useCallback(() => {
    if (!uploadedFile && !audioUrl) {
      alert('请先上传音频文件或输入音频URL');
      return;
    }

    const noiseTypes = {
      white: '白噪音',
      pink: '粉噪音',
      brown: '棕噪音'
    };

    let title: string;
    let trackUrl: string;
    
    if (audioSource === 'file' && uploadedFile) {
      title = `${uploadedFile.name} - LoFi处理`;
      trackUrl = URL.createObjectURL(uploadedFile);
    } else if (audioSource === 'url' && audioUrl) {
      const urlObj = new URL(audioUrl);
      const filename = urlObj.pathname.split('/').pop() || 'Unknown';
      title = `${filename} - LoFi处理`;
      trackUrl = audioUrl;
    } else {
      alert('音频源信息不完整');
      return;
    }

    const newTrack = {
      id: `processed_${Date.now()}`,
      title,
      artist: 'LoFi Processor',
      duration: 0, // 需要从音频文件获取
      url: trackUrl,
      isProcessed: true,
      processingSettings: {
        noiseType: currentNoiseType,
        volume: volume / 100,
        filterFrequency,
        processingIntensity: processingIntensity / 100,
        playbackRate: playbackRate / 100,
        lowCutFreq,
        highCutFreq,
        warmth: warmth / 100,
        saturation: saturation / 100,
        vocalSuppression: vocalSuppression / 100,
        spatialIntensity: spatialIntensity / 100,
        asmrMode,
        reverbAmount: reverbAmount / 100,
        stereoWidth: stereoWidth / 100
      }
    };

    addTrack(newTrack);
    alert('已保存到播放列表');
  }, [uploadedFile, audioUrl, audioSource, currentNoiseType, volume, filterFrequency, processingIntensity, playbackRate, lowCutFreq, highCutFreq, warmth, saturation, vocalSuppression, spatialIntensity, asmrMode, reverbAmount, stereoWidth, addTrack]);

  const noiseTypes = musicProcessorRef.current?.getAvailableNoiseTypes() || [];
  const processorState = musicProcessorRef.current?.getPlaybackState();

  return (
    <WindowFrame title="音乐噪音化处理器" className={styles.audioProcessor}>
      <div className={styles.container}>
        {/* 音频源选择区域 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>音频源选择</h3>
          
          {/* 音频源类型选择 */}
          <div className={styles.audioSourceSelector}>
            <Win98Button
              onClick={() => setAudioSource('file')}
              className={`${styles.sourceButton} ${audioSource === 'file' ? styles.active : ''}`}
            >
              本地文件
            </Win98Button>
            <Win98Button
              onClick={() => setAudioSource('url')}
              className={`${styles.sourceButton} ${audioSource === 'url' ? styles.active : ''}`}
            >
              在线URL
            </Win98Button>
          </div>

          {/* 文件上传 */}
          {audioSource === 'file' && (
            <div className={styles.fileUploadSection}>
              <FileUpload
                onFileSelect={handleFileUpload}
                accept="audio/*"
                className={styles.fileUpload}
              />
              {uploadedFile && (
                <div className={styles.fileInfo}>
                  <p><strong>已上传文件：</strong>{uploadedFile.name}</p>
                  <p><strong>文件大小：</strong>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
          )}

          {/* URL输入 */}
          {audioSource === 'url' && (
            <div className={styles.urlInputSection}>
              <div className={styles.urlInputContainer}>
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={handleUrlInputChange}
                  placeholder="请输入音频文件URL（支持MP3、WAV、M4A等格式）"
                  className={styles.urlInput}
                />
                <Win98Button
                  onClick={handleUrlLoad}
                  disabled={!urlInputValue.trim() || isLoading}
                  className={styles.loadUrlButton}
                >
                  加载
                </Win98Button>
              </div>
              {audioUrl && (
                <div className={styles.urlInfo}>
                  <p><strong>已加载URL：</strong>{audioUrl}</p>
                </div>
              )}
              <div className={styles.urlDescription}>
                <p>• 支持的格式：MP3, WAV, M4A, AAC, OGG, FLAC</p>
                <p>• 确保URL可以直接访问音频文件</p>
                <p>• 某些网站可能有跨域限制</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className={styles.loadingText}>正在加载音频文件...</div>
          )}
        </div>

        {/* 噪音类型选择 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>噪音化类型</h3>
          <div className={styles.noiseTypeGrid}>
            {noiseTypes.map(type => (
              <div key={type.value} className={styles.noiseTypeCard}>
                <Win98Button
                  onClick={() => changeNoiseType(type.value as 'white' | 'pink' | 'brown')}
                  className={styles.noiseTypeButton}
                >
                  {type.label}
                </Win98Button>
                <div className={styles.noiseDescription}>
                  {type.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 处理强度控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>噪音化强度</h3>
          <div className={styles.sliderContainer}>
            <Win98Slider
              min={0}
              max={100}
              value={processingIntensity}
              onChange={handleIntensityChange}
              className={styles.intensitySlider}
            />
            <span className={styles.sliderValue}>{processingIntensity}%</span>
          </div>
          <div className={styles.intensityDescription}>
            强度越高，原音乐越模糊，噪音效果越明显
          </div>
        </div>

        {/* 播放控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>播放控制</h3>
          <div className={styles.playControls}>
            <Win98Button
              onClick={toggleProcessedMusic}
              className={styles.playButton}
            >
              {isPlaying ? '停止' : '播放处理后音乐'}
            </Win98Button>
            <div className={styles.statusText}>
              {!processorState?.hasAudioLoaded 
                ? '请上传音频文件' 
                : isPlaying 
                  ? `正在播放: ${noiseTypes.find(t => t.value === currentNoiseType)?.label}化处理` 
                  : '已停止'
              }
            </div>
          </div>
        </div>

        {/* 音量控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>音量控制</h3>
          <div className={styles.sliderContainer}>
            <Win98Slider
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
            />
            <span className={styles.sliderValue}>{volume}%</span>
          </div>
        </div>

        {/* 播放速度控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>播放速度</h3>
          <div className={styles.sliderContainer}>
            <Win98Slider
              min={25}
              max={200}
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className={styles.speedSlider}
            />
            <span className={styles.sliderValue}>{(playbackRate / 100).toFixed(2)}x</span>
          </div>
          <div className={styles.speedDescription}>
            降低速度可营造更舒缓的氛围，适合学习和放松
          </div>
        </div>

        {/* 频率滤波控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>频率滤波</h3>
          <div className={styles.filterControls}>
            <div className={styles.sliderContainer}>
              <label className={styles.sliderLabel}>低频截止 (去除低频)</label>
              <Win98Slider
                min={20}
                max={500}
                value={lowCutFreq}
                onChange={handleLowCutChange}
                className={styles.lowCutSlider}
              />
              <span className={styles.sliderValue}>{lowCutFreq} Hz</span>
            </div>
            <div className={styles.sliderContainer}>
              <label className={styles.sliderLabel}>高频截止 (去除高频)</label>
              <Win98Slider
                min={1000}
                max={20000}
                value={highCutFreq}
                onChange={handleHighCutChange}
                className={styles.highCutSlider}
              />
              <span className={styles.sliderValue}>{highCutFreq} Hz</span>
            </div>
          </div>
          <div className={styles.filterDescription}>
            去除过高和过低的频率，保留中频部分，营造更舒适的听感
          </div>
        </div>

        {/* 低保真效果控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>LoFi 效果</h3>
          <div className={styles.lofiControls}>
            <div className={styles.sliderContainer}>
              <label className={styles.sliderLabel}>温暖度</label>
              <Win98Slider
                min={0}
                max={100}
                value={warmth}
                onChange={handleWarmthChange}
                className={styles.warmthSlider}
              />
              <span className={styles.sliderValue}>{warmth}%</span>
            </div>
            <div className={styles.sliderContainer}>
              <label className={styles.sliderLabel}>磁带饱和度</label>
              <Win98Slider
                min={0}
                max={100}
                value={saturation}
                onChange={handleSaturationChange}
                className={styles.saturationSlider}
              />
              <span className={styles.sliderValue}>{saturation}%</span>
            </div>
          </div>
          <div className={styles.lofiDescription}>
            温暖度增加低频丰富度，饱和度模拟磁带录音的自然失真
          </div>
        </div>

        {/* 人声处理控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>人声处理</h3>
          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>人声抑制强度</label>
            <Win98Slider
              min={0}
              max={100}
              value={vocalSuppression}
              onChange={handleVocalSuppressionChange}
              className={styles.vocalSuppressionSlider}
            />
            <span className={styles.sliderValue}>{vocalSuppression}%</span>
          </div>
          <div className={styles.vocalDescription}>
            减弱人声部分，突出背景音乐和乐器，营造更纯净的背景音效
          </div>
        </div>

        {/* 3D空间音频控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>3D 空间音频</h3>
          <div className={styles.spatialControls}>
            <div className={styles.sliderContainer}>
              <label className={styles.sliderLabel}>空间效果强度</label>
              <Win98Slider
                min={0}
                max={100}
                value={spatialIntensity}
                onChange={handleSpatialIntensityChange}
                className={styles.spatialSlider}
              />
              <span className={styles.sliderValue}>{spatialIntensity}%</span>
            </div>
            <div className={styles.sliderContainer}>
              <label className={styles.sliderLabel}>立体声宽度</label>
              <Win98Slider
                min={0}
                max={100}
                value={stereoWidth}
                onChange={handleStereoWidthChange}
                className={styles.stereoWidthSlider}
              />
              <span className={styles.sliderValue}>{stereoWidth}%</span>
            </div>
          </div>
          <div className={styles.spatialDescription}>
            增强音频的空间感和立体声效果，营造沉浸式的听觉体验
          </div>
        </div>

        {/* ASMR效果控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>ASMR 效果</h3>
          <div className={styles.asmrControls}>
            <div className={styles.toggleContainer}>
              <Win98Button
                onClick={handleAsmrModeToggle}
                className={`${styles.asmrToggle} ${asmrMode ? styles.active : ''}`}
              >
                {asmrMode ? 'ASMR模式：开启' : 'ASMR模式：关闭'}
              </Win98Button>
            </div>
            <div className={styles.sliderContainer}>
               <label className={styles.sliderLabel}>混响量</label>
               <Win98Slider
                 min={0}
                 max={100}
                 value={reverbAmount}
                 onChange={handleReverbAmountChange}
                 className={styles.reverbSlider}
               />
               <span className={styles.sliderValue}>{reverbAmount}%</span>
             </div>
          </div>
          <div className={styles.asmrDescription}>
            ASMR模式添加轻柔的混响和空间感，创造舒缓放松的听觉环境
          </div>
        </div>

        {/* 滤波器控制 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>音色调节</h3>
          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>低通滤波器频率</label>
            <Win98Slider
              min={200}
              max={8000}
              value={filterFrequency}
              onChange={handleFilterChange}
              className={styles.filterSlider}
            />
            <span className={styles.sliderValue}>{filterFrequency} Hz</span>
          </div>
          <div className={styles.filterDescription}>
            较低的频率会产生更温暖、更柔和的声音
          </div>
        </div>

        {/* 保存到播放列表 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>保存设置</h3>
          <Win98Button
            onClick={saveToPlaylist}
            className={styles.saveButton}
          >
            保存处理设置到播放列表
          </Win98Button>
        </div>

        {/* 使用说明 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>使用说明</h3>
          <div className={styles.instructions}>
            <p>• <strong>上传音频</strong>：支持常见音频格式（MP3、WAV、M4A等）</p>
            <p>• <strong>选择噪音类型</strong>：粉噪音最适合学习，棕噪音适合放松，白噪音适合遮蔽噪音</p>
            <p>• <strong>调节强度</strong>：控制原音乐与噪音的混合比例</p>
            <p>• <strong>人声处理</strong>：抑制人声部分，突出背景音乐和乐器</p>
            <p>• <strong>3D空间音频</strong>：增强立体声效果和空间感，营造沉浸式体验</p>
            <p>• <strong>ASMR效果</strong>：开启后添加轻柔混响，创造舒缓放松的听觉环境</p>
            <p>• <strong>音色调节</strong>：使用滤波器调整音色，获得更舒适的听觉体验</p>
            <p>• <strong>保存设置</strong>：将处理好的音乐保存到播放列表中</p>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};

export default AudioProcessor;