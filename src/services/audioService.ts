import * as Tone from 'tone';

// 音频处理服务类
export class AudioService {
  private player: Tone.Player | null = null;
  private reverb: Tone.Reverb | null = null;
  private lowpass: Tone.Filter | null = null;
  private highpass: Tone.Filter | null = null;
  private compressor: Tone.Compressor | null = null;
  private eq: Tone.EQ3 | null = null;
  private bitCrusher: Tone.BitCrusher | null = null;
  private chorus: Tone.Chorus | null = null;
  private distortion: Tone.Distortion | null = null;
  private tremolo: Tone.Tremolo | null = null;
  private noise: Tone.Noise | null = null;
  private noiseGain: Tone.Gain | null = null;
  // 3D空间音效处理器
  private stereoWidener: Tone.StereoWidener | null = null;
  private panner3D: Tone.Panner3D | null = null;
  private spatialGain: Tone.Gain | null = null;
  private isLofiMode: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeAudio();
  }

  // 初始化音频处理链
  private async initializeAudio() {
    try {
      // 确保Tone.js上下文已启动
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // 创建音频处理效果器
      this.reverb = new Tone.Reverb({
        decay: 2.5,
        wet: 0.3,
        preDelay: 0.01
      });

      this.lowpass = new Tone.Filter({
        frequency: 3000,
        type: 'lowpass',
        rolloff: -12
      });

      this.highpass = new Tone.Filter({
        frequency: 200,
        type: 'highpass',
        rolloff: -12
      });

      this.compressor = new Tone.Compressor({
        threshold: -20,
        ratio: 4,
        attack: 0.003,
        release: 0.1
      });

      this.eq = new Tone.EQ3({
        low: -3,
        mid: 0,
        high: -6,
        lowFrequency: 400,
        highFrequency: 2500
      });

      // Lofi特效
      this.bitCrusher = new Tone.BitCrusher(8);

      this.chorus = new Tone.Chorus({
        frequency: 0.5,
        delayTime: 3.5,
        depth: 0.7,
        wet: 0.3
      });

      this.distortion = new Tone.Distortion({
        distortion: 0.4,
        wet: 0.2
      });

      this.tremolo = new Tone.Tremolo({
        frequency: 4,
        depth: 0.3,
        wet: 0.4
      });

      // 背景噪音
      this.noise = new Tone.Noise({
        type: 'pink',
        volume: -40
      });

      this.noiseGain = new Tone.Gain(0.05);

      // 3D空间音效处理器
      this.stereoWidener = new Tone.StereoWidener({
        width: 0 // 初始立体声宽度为0（单声道）
      });

      this.panner3D = new Tone.Panner3D({
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        orientationX: 0,
        orientationY: 0,
        orientationZ: -1
      });

      this.spatialGain = new Tone.Gain(1);

      // 等待混响加载完成
      await this.reverb.generate();
      
      // 启动合唱和颤音效果
      this.chorus.start();
      this.tremolo.start();
      
      // 连接背景噪音
      if (this.noise && this.noiseGain) {
        this.noise.connect(this.noiseGain);
        this.noiseGain.toDestination();
      }

      this.isInitialized = true;
      console.log('Audio service initialized');
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  // 加载音频文件
  async loadAudio(url: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAudio();
    }

    try {
      // 停止并释放之前的播放器
      if (this.player) {
        this.player.stop();
        this.player.dispose();
      }

      // 创建新的播放器
      this.player = new Tone.Player({
        url: url,
        loop: false,
        autostart: false
      });

      // 连接音频处理链
      this.connectAudioChain();

      // 等待音频加载完成
      await Tone.loaded();
      console.log('Audio loaded successfully');
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw new Error('音频加载失败');
    }
  }

  // 连接音频处理链
  private connectAudioChain() {
    if (!this.player || !this.reverb || !this.lowpass || !this.highpass || !this.compressor || !this.eq || !this.stereoWidener || !this.panner3D || !this.spatialGain) {
      return;
    }

    if (this.isLofiMode) {
      // Lofi模式：应用所有效果，包括3D空间音效
      this.player
        .chain(
          this.highpass,
          this.lowpass,
          this.bitCrusher,
          this.distortion,
          this.eq,
          this.chorus,
          this.tremolo,
          this.compressor,
          this.reverb,
          this.stereoWidener,
          this.panner3D,
          this.spatialGain,
          Tone.Destination
        );
    } else {
      // 普通模式：应用基础效果和3D空间音效
      this.player
        .chain(
          this.compressor,
          this.stereoWidener,
          this.panner3D,
          this.spatialGain,
          Tone.Destination
        );
    }

    // 控制背景噪音
    if (this.noise && this.noiseGain) {
      // 将噪音也连接到3D空间处理器
      this.noise.chain(this.noiseGain, this.spatialGain, Tone.Destination);
      
      if (this.isLofiMode) {
        if (this.noise.state !== 'started') {
          this.noise.start();
        }
      } else {
        if (this.noise.state === 'started') {
          this.noise.stop();
        }
      }
    }

    console.log(`Lofi mode ${this.isLofiMode ? 'enabled' : 'disabled'}`);
  }

  // 播放音频
  async play(): Promise<void> {
    if (!this.player) {
      throw new Error('No audio loaded');
    }

    try {
      // 确保音频上下文已启动
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      this.player.start();
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw new Error('播放失败');
    }
  }

  // 暂停音频
  pause(): void {
    if (this.player) {
      this.player.stop();
    }
  }

  // 停止音频
  stop(): void {
    if (this.player) {
      this.player.stop();
    }
  }

  // 设置音量
  setVolume(volume: number): void {
    if (this.player) {
      // 将0-1的音量转换为分贝
      const db = volume === 0 ? -Infinity : Tone.gainToDb(volume);
      this.player.volume.value = db;
    }
  }

  // 获取当前播放时间
  getCurrentTime(): number {
    if (this.player && this.player.state === 'started') {
      return Tone.Transport.seconds;
    }
    return 0;
  }

  // 获取音频总时长
  getDuration(): number {
    if (this.player && this.player.buffer.loaded) {
      return this.player.buffer.duration;
    }
    return 0;
  }

  // 设置播放位置
  setCurrentTime(time: number): void {
    if (this.player && this.player.buffer.loaded) {
      const isPlaying = this.player.state === 'started';
      this.player.stop();
      if (isPlaying) {
        this.player.start(0, time);
      }
    }
  }

  // 切换Lofi模式
  toggleLofiMode(enabled: boolean): void {
    this.isLofiMode = enabled;
    
    if (this.player) {
      // 重新连接音频处理链
      this.player.disconnect();
      this.connectAudioChain();
    }
  }

  /**
   * 更新音效参数
   * @param effects 音效参数对象
   */
  updateAudioEffects(effects: {
    speed: number;
    lowpass: number;
    highpass: number;
    noise: number;
    reverb: number;
    spatial: number;
  }): void {
    try {
      // 更新播放速度
      if (this.player) {
        this.player.playbackRate = effects.speed / 100;
      }

      // 更新低通滤波器
      if (this.lowpass) {
        const frequency = 20000 * (effects.lowpass / 100);
        this.lowpass.frequency.value = Math.max(200, frequency);
      }

      // 更新高通滤波器
      if (this.highpass) {
        const frequency = 2000 * (effects.highpass / 100);
        this.highpass.frequency.value = Math.min(2000, frequency);
      }

      // 更新混响
      if (this.reverb) {
        this.reverb.wet.value = effects.reverb / 100;
      }

      // 更新白噪音
      if (this.noise && this.noiseGain) {
        if (effects.noise > 0) {
          if (this.noise.state !== 'started') {
            this.noise.start();
          }
          this.noiseGain.gain.value = (effects.noise / 100) * 0.1; // 限制噪音音量
        } else {
          if (this.noise.state === 'started') {
            this.noise.stop();
          }
          this.noiseGain.gain.value = 0;
        }
      }

      // 3D空间音效：立体声宽度和空间定位
      if (this.stereoWidener) {
        // 立体声宽度：0-100% 映射到 0-1
        this.stereoWidener.width.value = effects.spatial / 100;
      }

      if (this.panner3D && this.spatialGain) {
        // 3D定位：根据空间音效强度调整位置和增益
        const spatialIntensity = effects.spatial / 100;
        
        // 固定的3D位置，避免动态变化导致的不稳定
        this.panner3D.positionX.value = spatialIntensity * 1.5;
        this.panner3D.positionY.value = spatialIntensity * 1.0;
        this.panner3D.positionZ.value = spatialIntensity * -2; // 向后移动增加深度感
        
        // 调整空间增益
        this.spatialGain.gain.value = 1 + (spatialIntensity * 0.2);
      }

      // 保持原有的合唱效果作为额外的空间感
      if (this.chorus) {
        this.chorus.wet.value = effects.spatial / 100 * 0.4;
      }

    } catch (error) {
      console.error('Failed to update audio effects:', error);
    }
  }



  // 调整Lofi效果强度
  setLofiIntensity(intensity: number): void {
    // intensity: 0-1
    if (this.bitCrusher) {
      this.bitCrusher.wet.value = intensity * 0.5;
    }
    if (this.distortion) {
      this.distortion.wet.value = intensity * 0.3;
    }
    if (this.tremolo) {
      this.tremolo.wet.value = intensity * 0.6;
    }
    if (this.noiseGain) {
      this.noiseGain.gain.value = intensity * 0.08;
    }
  }

  // 获取音频分析数据（用于可视化）
  getAnalyser(): Tone.Analyser | null {
    if (!this.player) return null;

    const analyser = new Tone.Analyser('fft', 256);
    this.player.connect(analyser);
    return analyser;
  }

  // 检查是否正在播放
  isPlaying(): boolean {
    return this.player ? this.player.state === 'started' : false;
  }

  // 释放资源
  dispose(): void {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }
    if (this.lowpass) {
      this.lowpass.dispose();
      this.lowpass = null;
    }
    if (this.highpass) {
      this.highpass.dispose();
      this.highpass = null;
    }
    if (this.compressor) {
      this.compressor.dispose();
      this.compressor = null;
    }
    if (this.eq) {
      this.eq.dispose();
      this.eq = null;
    }
    if (this.bitCrusher) {
      this.bitCrusher.dispose();
      this.bitCrusher = null;
    }
    if (this.chorus) {
      this.chorus.dispose();
      this.chorus = null;
    }
    if (this.distortion) {
      this.distortion.dispose();
      this.distortion = null;
    }
    if (this.tremolo) {
      this.tremolo.dispose();
      this.tremolo = null;
    }
    if (this.noise) {
      this.noise.dispose();
      this.noise = null;
    }
    if (this.noiseGain) {
      this.noiseGain.dispose();
      this.noiseGain = null;
    }
    if (this.stereoWidener) {
      this.stereoWidener.dispose();
      this.stereoWidener = null;
    }
    if (this.panner3D) {
      this.panner3D.dispose();
      this.panner3D = null;
    }
    if (this.spatialGain) {
      this.spatialGain.dispose();
      this.spatialGain = null;
    }
  }
}

// 创建全局音频服务实例
export const audioService = new AudioService();

// 音频工具函数
export const audioUtils = {
  // 格式化时间显示
  formatTime: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // 检查浏览器音频支持
  checkAudioSupport: (): boolean => {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  },

  // 请求音频权限
  requestAudioPermission: async (): Promise<boolean> => {
    try {
      await Tone.start();
      return true;
    } catch (error) {
      console.error('Failed to start audio context:', error);
      return false;
    }
  }
};