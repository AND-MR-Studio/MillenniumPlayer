import * as Tone from 'tone';

// 音频效果参数接口
export interface AudioEffects {
  speed: number;        // 播放速度 (25-200, 对应0.25-2.0)
  lowpass: number;      // 低通滤波 (1000-20000 Hz)
  highpass: number;     // 高通滤波 (20-500 Hz)
  noise: number;        // 白噪音强度 (0-100)
  reverb: number;       // 混响强度 (0-100)
  spatial: number;      // 3D空间音效 (0-100)
  warmth: number;       // 温暖度 (0-100)
  saturation: number;   // 饱和度 (0-100)
  vocalSuppression: number; // 人声抑制 (0-100)
  stereoWidth: number;  // 立体声宽度 (0-100)
  asmrMode: boolean;    // ASMR模式
  noiseType: 'white' | 'pink' | 'brown'; // 噪音类型
}

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
  // 新增的音效处理器
  private warmthFilter: Tone.Filter | null = null;
  private saturationDistortion: Tone.Distortion | null = null;
  private vocalSuppressor: Tone.MidSideCompressor | null = null;
  private masterGain: Tone.Gain | null = null;
  private analyser: Tone.Analyser | null = null;
  private startTime: number = 0;
  
  private isLofiMode: boolean = false;
  private isInitialized: boolean = false;
  private currentNoiseType: 'white' | 'pink' | 'brown' = 'pink';

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

      // 创建主增益控制
      this.masterGain = new Tone.Gain(0.7);

      // 创建音频处理效果器
      this.reverb = new Tone.Reverb({
        decay: 2.5,
        wet: 0.2,
        preDelay: 0.01
      });

      this.lowpass = new Tone.Filter({
        frequency: 8000,
        type: 'lowpass',
        rolloff: -12
      });

      this.highpass = new Tone.Filter({
        frequency: 80,
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
        low: 2,
        mid: 0,
        high: -3,
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
        distortion: 0.2,
        wet: 0.1
      });

      this.tremolo = new Tone.Tremolo({
        frequency: 4,
        depth: 0.2,
        wet: 0.3
      });

      // 创建温暖度滤波器
      this.warmthFilter = new Tone.Filter({
        frequency: 1000,
        type: 'lowshelf',
        gain: 3
      });

      // 创建饱和度失真
      this.saturationDistortion = new Tone.Distortion({
        distortion: 0.1,
        wet: 0.2
      });

      // 创建人声抑制器
      this.vocalSuppressor = new Tone.MidSideCompressor({
        mid: {
          threshold: -30,
          ratio: 8,
          attack: 0.003,
          release: 0.1
        },
        side: {
          threshold: -20,
          ratio: 2,
          attack: 0.003,
          release: 0.1
        }
      });

      // 背景噪音
      this.noise = new Tone.Noise({
        type: this.currentNoiseType,
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

      // 创建音频分析器
      this.analyser = new Tone.Analyser('fft', 256);
      
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
      console.log('Audio service initialized with analyser');
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

      // 等待音频加载完成
      await Tone.loaded();
      
      // 音频加载完成后连接音频处理链
      this.connectAudioChain();
      
      console.log('Audio loaded and chain connected');
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw new Error('音频加载失败');
    }
  }

  // 连接音频处理链
  private connectAudioChain() {
    if (!this.player || !this.reverb || !this.lowpass || !this.highpass || !this.compressor || !this.eq || !this.stereoWidener || !this.panner3D || !this.spatialGain || !this.masterGain) {
      return;
    }

    // 断开所有现有连接
    this.player.disconnect();
    if (this.noise && this.noiseGain) {
      this.noise.disconnect();
      this.noiseGain.disconnect();
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }

    // 总是应用所有音效处理器，不区分Lofi模式
    // 音效的强度通过updateAudioEffects方法中的参数控制
    this.player
      .chain(
        this.highpass,
        this.lowpass,
        this.warmthFilter,
        this.saturationDistortion,
        this.vocalSuppressor,
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
        this.masterGain,
        Tone.Destination
      );

    // 连接分析器到主增益控制器，用于音频可视化
    if (this.analyser && this.masterGain) {
      this.masterGain.connect(this.analyser);
    }

    // 连接背景噪音到主增益控制器
    if (this.noise && this.noiseGain) {
      this.noise.chain(this.noiseGain, this.masterGain);
    }

    console.log('Audio chain connected with all effects and analyser');
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

      // 记录开始时间
      this.startTime = Tone.now();
      
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
      // 使用Tone.now()减去播放开始时间来计算当前播放时间
      const now = Tone.now();
      // 使用公共属性而不是私有属性
      return Math.max(0, now - (this.startTime || 0));
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
      const volume = this.player.volume.value;
      
      // 停止当前播放
      this.player.stop();
      
      // 如果之前在播放，从新位置开始播放
      if (isPlaying) {
        // 使用setTimeout确保stop操作完成
        setTimeout(() => {
          if (this.player) {
            this.player.start('+0.1', time);
          }
        }, 100);
      }
    }
  }

  // 切换Lofi模式
  toggleLofiMode(enabled: boolean): void {
    this.isLofiMode = enabled;
    console.log(`Lofi mode ${enabled ? 'enabled' : 'disabled'}`);
    // 不需要重新连接音频链，因为所有效果都始终连接
    // 效果的强度通过updateAudioEffects方法控制
  }

  /**
   * 更新音效参数
   * @param effects 音效参数对象
   */
  updateAudioEffects(effects: AudioEffects): void {
    try {
      // 更新播放速度
      if (this.player) {
        // effects.speed 范围是 50-150，对应播放速度 0.5-1.5
        const playbackRate = effects.speed / 100;
        const wasPlaying = this.player.state === 'started';
        const currentTime = this.getCurrentTime();
        
        // 如果正在播放，需要停止后重新开始以应用新的播放速度
        if (wasPlaying) {
          this.player.stop();
        }
        
        this.player.playbackRate = Math.max(0.25, Math.min(4, playbackRate));
        console.log(`播放速度设置为: ${playbackRate}x (${effects.speed}%)`);
        
        // 如果之前在播放，从当前位置重新开始播放
        if (wasPlaying) {
          setTimeout(() => {
            if (this.player) {
              this.player.start(0, currentTime);
            }
          }, 50);
        }
      }

      // 更新低通滤波器
      if (this.lowpass) {
        this.lowpass.frequency.value = Math.max(1000, Math.min(20000, effects.lowpass));
      }

      // 更新高通滤波器
      if (this.highpass) {
        this.highpass.frequency.value = Math.max(20, Math.min(500, effects.highpass));
      }

      // 更新混响
      if (this.reverb) {
        this.reverb.wet.value = effects.reverb / 100;
      }

      // 更新白噪音类型和强度
      if (this.noise && this.noiseGain) {
        // 更新噪音类型
        if (this.currentNoiseType !== effects.noiseType) {
          this.currentNoiseType = effects.noiseType;
          // 重新创建噪音源以改变类型
          const wasStarted = this.noise.state === 'started';
          if (wasStarted) {
            this.noise.stop();
          }
          this.noise.dispose();
          this.noise = new Tone.Noise({
            type: effects.noiseType,
            volume: -40
          });
          this.noise.chain(this.noiseGain, this.masterGain);
          if (wasStarted && effects.noise > 0) {
            this.noise.start();
          }
        }
        
        if (effects.noise > 0) {
          if (this.noise.state !== 'started') {
            this.noise.start();
          }
          this.noiseGain.gain.value = (effects.noise / 100) * 0.05;
        } else {
          if (this.noise.state === 'started') {
            this.noise.stop();
          }
          this.noiseGain.gain.value = 0;
        }
      }

      // 更新温暖度
      if (this.warmthFilter) {
        this.warmthFilter.gain.value = (effects.warmth / 100) * 6; // 0-6dB增益
      }

      // 更新饱和度
      if (this.saturationDistortion) {
        this.saturationDistortion.distortion = (effects.saturation / 100) * 0.5;
        this.saturationDistortion.wet.value = (effects.saturation / 100) * 0.3;
      }

      // 更新人声抑制
      if (this.vocalSuppressor) {
        const intensity = effects.vocalSuppression / 100;
        this.vocalSuppressor.mid.ratio.value = 1 + intensity * 15;
        this.vocalSuppressor.mid.threshold.value = -30 + intensity * 20;
      }

      // 更新立体声宽度
      if (this.stereoWidener) {
        this.stereoWidener.width.value = effects.stereoWidth / 100;
      }

      // 3D空间音效：立体声宽度和空间定位
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

      // 更新ASMR模式
      if (effects.asmrMode) {
        if (this.reverb && this.tremolo) {
          this.reverb.wet.value = Math.max(0.4, this.reverb.wet.value);
          this.reverb.decay = 3.5;
          this.tremolo.wet.value = 0.5;
          this.tremolo.depth.value = 0.4;
        }
      } else {
        if (this.reverb && this.tremolo) {
          // 恢复正常混响设置（如果不是通过reverb参数设置的话）
          if (effects.reverb <= 20) {
            this.reverb.decay = 2.5;
          }
          this.tremolo.wet.value = 0.3;
          this.tremolo.depth.value = 0.2;
        }
      }

      // 更新处理强度（影响位深压缩和噪音）
      const processingIntensity = Math.max(effects.noise, effects.saturation, effects.warmth) / 100;
      if (this.bitCrusher) {
        this.bitCrusher.bits.value = Math.max(1, Math.min(16, 16 - processingIntensity * 8));
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
  // 获取音频分析器
  getAnalyser(): Tone.Analyser | null {
    return this.analyser;
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