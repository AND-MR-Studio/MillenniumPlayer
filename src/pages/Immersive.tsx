import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Button, ProgressBar, Panel } from 'react95';
import * as THREE from 'three';
import * as Tone from 'tone';
import { useStore, Song } from '../store/useStore';
import { audioService } from '../services/audioService';

const ImmersiveContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  position: relative;
  overflow: hidden;
  cursor: none;
`;

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 5px;
  opacity: 0;
  transition: opacity 0.3s;
  
  &.visible {
    opacity: 1;
  }
`;

const ControlButton = styled.button`
  background: #c0c0c0;
  border: 2px outset #c0c0c0;
  padding: 8px 16px;
  font-family: 'Sango-JA-SVG', sans-serif;
  font-size: 11px;
  cursor: pointer;
  
  &:active {
    border: 2px inset #c0c0c0;
  }
  
  &:disabled {
    color: #808080;
    background: #e0e0e0;
  }
`;

const SongInfo = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  color: #fff;
  font-family: 'Sango-JA-SVG', sans-serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0;
  transition: opacity 0.3s;
  
  &.visible {
    opacity: 1;
  }
  
  .title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .artist {
    font-size: 14px;
    color: #ccc;
  }
`;

const ExitHint = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  color: #fff;
  font-family: 'Sango-JA-SVG', sans-serif;
  font-size: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0.7;
`;





const Immersive: React.FC = () => {
  const navigate = useNavigate();
  const {
    playback,
    setCurrentPage,
    setIsPlaying,
    setCurrentSong,
    playNext,
    playPrevious,
    togglePlay
  } = useStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const [showControls, setShowControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSongState] = useState<Song | null>(null);

  // 初始化Three.js场景
  const initThreeJS = useCallback(() => {
    if (!canvasRef.current) return;

    // 场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    rendererRef.current = renderer;

    // 创建多层粒子系统
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // 创建球形分布的粒子
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // 像素风格的颜色调色板
      const colorPalette = [
        [1.0, 0.2, 0.8], // 粉色
        [0.2, 0.8, 1.0], // 青色
        [1.0, 0.8, 0.2], // 黄色
        [0.8, 0.2, 1.0], // 紫色
        [0.2, 1.0, 0.4], // 绿色
      ];
      const colorIndex = Math.floor(Math.random() * colorPalette.length);
      colors[i * 3] = colorPalette[colorIndex][0];
      colors[i * 3 + 1] = colorPalette[colorIndex][1];
      colors[i * 3 + 2] = colorPalette[colorIndex][2];
      
      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建像素风格的粒子材质
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
    
    // 添加背景网格
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -10;
    scene.add(gridHelper);
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // 添加点光源
    const pointLight = new THREE.PointLight(0xff00ff, 1, 100);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 处理窗口大小变化
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 初始化音频处理
  const initAudio = useCallback(async () => {
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // 创建分析器
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // 初始化Tone.js
      await Tone.start();
      
      // 创建音效处理链
      const reverb = new Tone.Reverb({
        decay: 2,
        wet: 0.3
      }).toDestination();
      reverbRef.current = reverb;

      // 低通滤波器（削减高频）
      const filter = new Tone.Filter({
        frequency: 8000,
        type: 'lowpass',
        rolloff: -24
      }).connect(reverb);
      filterRef.current = filter;

      console.log('音频系统初始化完成');
    } catch (error) {
      console.error('音频初始化失败:', error);
    }
  }, []);

  // 动画循环
  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const time = Date.now() * 0.001;
    
    // 音频可视化
    if (analyserRef.current && particlesRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // 计算音频强度
      let audioIntensity = 0;
      for (let i = 0; i < dataArray.length; i++) {
        audioIntensity += dataArray[i];
      }
      audioIntensity = audioIntensity / dataArray.length / 255;

      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
      const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array;
      
      // 获取原始位置（用于重置）
      const originalPositions = particlesRef.current.geometry.userData.originalPositions;
      if (!originalPositions) {
        particlesRef.current.geometry.userData.originalPositions = positions.slice();
      }

      for (let i = 0; i < positions.length / 3; i++) {
        const audioIndex = Math.floor((i / (positions.length / 3)) * dataArray.length);
        const audioValue = dataArray[audioIndex] / 255;
        const baseAudioValue = audioValue * audioIntensity;
        
        // 波浪效果
        const wave = Math.sin(time * 2 + i * 0.1) * 0.5;
        const audioWave = Math.sin(time * 5 + audioValue * 10) * baseAudioValue;
        
        // 粒子位置动画
        const radius = 5 + audioValue * 10 + wave * 2;
        const theta = time * 0.5 + i * 0.01;
        const phi = Math.sin(time * 0.3 + i * 0.05) * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + audioWave;
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + audioWave;
        positions[i * 3 + 2] = radius * Math.cos(phi) + audioWave;
        
        // 动态颜色变化
        const hue = (time * 0.1 + audioValue + i * 0.01) % 1;
        const saturation = 0.8 + audioValue * 0.2;
        const lightness = 0.5 + audioValue * 0.3;
        
        // HSL to RGB conversion
        const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
        const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
        const m = lightness - c / 2;
        
        let r, g, b;
        if (hue < 1/6) {
          r = c; g = x; b = 0;
        } else if (hue < 2/6) {
          r = x; g = c; b = 0;
        } else if (hue < 3/6) {
          r = 0; g = c; b = x;
        } else if (hue < 4/6) {
          r = 0; g = x; b = c;
        } else if (hue < 5/6) {
          r = x; g = 0; b = c;
        } else {
          r = c; g = 0; b = x;
        }
        
        colors[i * 3] = r + m;
        colors[i * 3 + 1] = g + m;
        colors[i * 3 + 2] = b + m;
        
        // 动态大小变化
        sizes[i] = 0.05 + audioValue * 0.15 + Math.sin(time * 3 + i * 0.1) * 0.02;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.color.needsUpdate = true;
      particlesRef.current.geometry.attributes.size.needsUpdate = true;

      // 整体旋转和缩放
      particlesRef.current.rotation.x = Math.sin(time * 0.2) * 0.3;
      particlesRef.current.rotation.y = time * 0.1;
      particlesRef.current.rotation.z = Math.cos(time * 0.15) * 0.2;
      
      const scale = 1 + audioIntensity * 0.3;
      particlesRef.current.scale.set(scale, scale, scale);
      
      // 相机动画
      cameraRef.current.position.x = Math.sin(time * 0.1) * 2;
      cameraRef.current.position.y = Math.cos(time * 0.08) * 1;
      cameraRef.current.position.z = 5 + Math.sin(time * 0.05) * 2;
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, []);

  // 播放歌曲
  const playSong = useCallback(async (song: Song) => {
    if (!song) return;
    
    try {
      setLoading(true);
      
      let audioUrl = '';
      
      // 如果是本地文件，直接使用路径
      if (song.url && song.url.startsWith('/sounds/')) {
        audioUrl = song.url;
      } else if (song.id) {
        // 尝试获取网易云音乐地址
        try {
          const response = await fetch(`/api/netease/song/url?id=${song.id}`);
          const data = await response.json();
          
          if (data.code === 200 && data.data[0]?.url) {
            audioUrl = data.data[0].url;
          } else {
            throw new Error('无法获取歌曲播放地址');
          }
        } catch (apiError) {
          console.warn('网易云API调用失败，尝试使用本地文件:', apiError);
          // 如果API失败，尝试使用本地默认文件
          audioUrl = '/sounds/' + encodeURIComponent('NewBoy.mp3');
        }
      } else {
        // 默认使用本地文件
        audioUrl = '/sounds/' + encodeURIComponent('NewBoy.mp3');
      }
      
      if (!audioUrl) {
        throw new Error('无法确定音频文件路径');
      }
      
      // 停止当前播放
      if (playerRef.current) {
        try {
          if (playerRef.current.state === 'started') {
            playerRef.current.stop();
          }
          playerRef.current.dispose();
        } catch (error) {
          console.warn('停止播放器时出错:', error);
        }
        playerRef.current = null;
      }
      
      // 创建新的播放器
      const player = new Tone.Player({
        url: audioUrl,
        onload: () => {
          setLoading(false);
          console.log('歌曲加载完成:', song.name);
          // 音频加载完成后自动开始播放
          try {
            if (player.loaded && player.state === 'stopped') {
              player.start();
              setIsPlaying(true);
            }
          } catch (error) {
            console.error('自动播放失败:', error);
          }
        },
        onerror: (error) => {
          console.error('音频加载失败:', error);
          setLoading(false);
        }
      });
      
      if (filterRef.current) {
        player.connect(filterRef.current);
      }
      
      playerRef.current = player;
      setCurrentSong(song);
      setCurrentSongState(song);
      
    } catch (error) {
      console.error('播放歌曲失败:', error);
      setLoading(false);
    }
  }, [setCurrentSong, setIsPlaying]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/desktop');
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    const handleMouseMove = () => {
      setShowControls(true);
      setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [navigate]);

  // 播放控制
  const togglePlayPause = useCallback(() => {
    if (playerRef.current) {
      try {
        if (playback.isPlaying) {
          if (playerRef.current.state === 'started') {
            playerRef.current.stop();
          }
          setIsPlaying(false);
        } else {
          if (playerRef.current.loaded && playerRef.current.state === 'stopped') {
            playerRef.current.start();
            setIsPlaying(true);
          }
        }
      } catch (error) {
        console.error('播放控制失败:', error);
      }
    }
  }, [playback.isPlaying, setIsPlaying]);

  const nextSong = useCallback(() => {
    if (playback.playlist && playback.currentIndex < playback.playlist.length - 1) {
      playNext();
      const nextSong = playback.playlist[playback.currentIndex + 1];
      playSong(nextSong);
    }
  }, [playback, playNext, playSong]);

  const prevSong = useCallback(() => {
    if (playback.playlist && playback.currentIndex > 0) {
      playPrevious();
      const prevSong = playback.playlist[playback.currentIndex - 1];
      playSong(prevSong);
    }
  }, [playback, playPrevious, playSong]);

  // 组件初始化
  useEffect(() => {
    // 检查播放状态
    if (!playback.playlist || playback.playlist.length === 0) {
      navigate('/desktop');
      return;
    }

    // 初始化Three.js和音频
    initThreeJS();
    initAudio();

    // 播放进入沉浸模式的音效
    const playEnterSound = async () => {
      try {
        const enterSound = new Audio('/sounds/Windows XP （番茄花园版）关机_爱给网_aigei_com.mp3');
        enterSound.volume = 0.3; // 设置音量为30%
        await enterSound.play();
        console.log('进入沉浸模式音效播放成功');
      } catch (error) {
        console.warn('进入沉浸模式音效播放失败:', error);
      }
    };
    
    // 延迟播放音效，确保页面已完全加载
    setTimeout(playEnterSound, 300);

    // 设置当前页面状态
    setCurrentPage('immersive');
    
    // 自动开始播放当前歌曲
    if (playback.currentSong) {
      // 延迟一点时间确保音频系统初始化完成
      setTimeout(() => {
        playSong(playback.currentSong!);
      }, 500);
    } else if (playback.playlist.length > 0) {
      // 如果没有当前歌曲，播放第一首
      setTimeout(() => {
        playSong(playback.playlist[0]);
      }, 500);
    }

    // 开始动画
    animate();

    return () => {
      // 清理资源
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (playerRef.current) {
        try {
          if (playerRef.current.state === 'started') {
            playerRef.current.stop();
          }
          playerRef.current.dispose();
        } catch (error) {
          console.warn('清理播放器时出错:', error);
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [navigate, initThreeJS, initAudio, playSong, animate, playback]);

  return (
    <ImmersiveContainer>
      <CanvasContainer>
        <canvas ref={canvasRef} />
      </CanvasContainer>

      <ExitHint>
        按 ESC 返回桌面
      </ExitHint>

      <SongInfo className={showControls ? 'visible' : ''}>
        {(playback.currentSong || currentSong) && (
        <>
          <div className="title">{(playback.currentSong || currentSong)?.name}</div>
          <div className="artist">
            {(playback.currentSong || currentSong)?.artist || ''}
          </div>
        </>
        )}
      </SongInfo>

      <ControlsOverlay className={showControls ? 'visible' : ''}>
        <ControlButton
          onClick={prevSong}
          disabled={playback.currentIndex === 0}
        >
          上一首
        </ControlButton>
        
        <ControlButton
          onClick={togglePlayPause}
          disabled={loading}
        >
          {loading ? '加载中...' : (playback.isPlaying ? '暂停' : '播放')}
        </ControlButton>
        
        <ControlButton
          onClick={nextSong}
          disabled={!playback.playlist || playback.currentIndex >= playback.playlist.length - 1}
        >
          下一首
        </ControlButton>
        
        <ControlButton onClick={() => navigate('/desktop')}>
          返回桌面
        </ControlButton>
      </ControlsOverlay>
    </ImmersiveContainer>
  );
};

export default Immersive;