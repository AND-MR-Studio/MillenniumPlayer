import * as Tone from 'tone';

/**
 * 音乐噪音处理器类
 * 提供完整的LoFi音效处理功能
 */
export class MusicNoiseProcessor {
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
  private stereoWidener: Tone.StereoWidener | null = null;
  private panner3D: Tone.Panner3D | null = null;
  private spatialGain: Tone.Gain | null = null;
  private warmthFilter: Tone.Filter | null = null;
  private saturationDistortion: Tone.Distortion | null = null;
  private vocalSuppressor: Tone.MidSideCompressor | null = null;
  private masterGain: Tone.Gain | null = null;
  
  private isInitialized: boolean = false;
  private currentNoiseType: 'white' | 'pink' | 'brown' = 'pink';
  private audioBuffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  
  constructor() {
    this.initializeAudio();
  }

  /**
   * 初始化音频处理链
   */
  private async initializeAudio() {
    try {
      // 确保Tone.js上下文已启动
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // 创建主增益控制
      this.masterGain = new Tone.Gain(0.7);

      // 创建音频播放器
      this.player = new Tone.Player();

      // 创建混响效果
      this.reverb = new Tone.Reverb({
        decay: 2.5,
        wet: 0.2,
        preDelay: 0.01
      });

      // 创建滤波器
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

      // 创建压缩器
      this.compressor = new Tone.Compressor({
        threshold: -20,
        ratio: 4,
        attack: 0.003,
        release: 0.1
      });

      // 创建均衡器
      this.eq = new Tone.EQ3({
        low: 2,
        mid: 0,
        high: -3,
        lowFrequency: 400,
        highFrequency: 2500
      });

      // 创建LoFi效果
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

      // 创建立体声宽度处理
      this.stereoWidener = new Tone.StereoWidener(0.5);

      // 创建3D空间音效
      this.panner3D = new Tone.Panner3D({
        positionX: 0,
        positionY: 0,
        positionZ: 0
      });

      this.spatialGain = new Tone.Gain(1);

      // 创建背景噪音
      this.noise = new Tone.Noise({
        type: this.currentNoiseType,
        volume: -40
      });

      this.noiseGain = new Tone.Gain(0.3);

      // 连接音频处理链
      this.connectAudioChain();

      this.isInitialized = true;
      console.log('MusicNoiseProcessor 初始化完成');
    } catch (error) {
      console.error('MusicNoiseProcessor 初始化失败:', error);
    }
  }

  /**
   * 连接音频处理链
   */
  private connectAudioChain() {
    if (!this.player || !this.masterGain) return;

    // 主音频链：播放器 -> 高通 -> 低通 -> 温暖度 -> 饱和度 -> 人声抑制 -> EQ -> 压缩 -> 混响 -> 立体声宽度 -> 3D空间 -> 主增益 -> 输出
    this.player
      .connect(this.highpass!)
      .connect(this.lowpass!)
      .connect(this.warmthFilter!)
      .connect(this.saturationDistortion!)
      .connect(this.vocalSuppressor!)
      .connect(this.eq!)
      .connect(this.compressor!)
      .connect(this.reverb!)
      .connect(this.stereoWidener!)
      .connect(this.panner3D!)
      .connect(this.spatialGain!)
      .connect(this.masterGain)
      .toDestination();

    // 噪音链：噪音 -> 噪音增益 -> 主增益
    this.noise!
      .connect(this.noiseGain!)
      .connect(this.masterGain);
  }

  /**
   * 加载音频文件
   */
  async loadAudioFile(file: File): Promise<void> {
    if (!this.player) throw new Error('音频处理器未初始化');

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
    
    this.audioBuffer = audioBuffer;
    this.player.buffer = new Tone.ToneAudioBuffer(audioBuffer);
    
    console.log('音频文件加载成功:', file.name);
  }

  /**
   * 从URL加载音频
   */
  async loadAudioFromUrl(url: string): Promise<void> {
    if (!this.player) throw new Error('音频处理器未初始化');

    try {
      await this.player.load(url);
      console.log('URL音频加载成功:', url);
    } catch (error) {
      throw new Error(`无法加载音频URL: ${error}`);
    }
  }

  /**
   * 开始播放处理后的音乐
   */
  async startProcessedMusic(): Promise<void> {
    if (!this.player || !this.noise) throw new Error('音频处理器未初始化');
    if (!this.audioBuffer && !this.player.loaded) throw new Error('未加载音频文件');

    try {
      await Tone.start();
      this.player.start();
      this.noise.start();
      this.isPlaying = true;
      console.log('开始播放处理后的音乐');
    } catch (error) {
      console.error('播放失败:', error);
      throw error;
    }
  }

  /**
   * 停止播放处理后的音乐
   */
  stopProcessedMusic(): void {
    if (this.player) {
      this.player.stop();
    }
    if (this.noise) {
      this.noise.stop();
    }
    this.isPlaying = false;
    console.log('停止播放处理后的音乐');
  }

  /**
   * 设置噪音类型
   */
  setNoiseType(type: 'white' | 'pink' | 'brown'): void {
    this.currentNoiseType = type;
    if (this.noise) {
      this.noise.type = type;
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 设置滤波器频率
   */
  setFilterFrequency(frequency: number): void {
    if (this.lowpass) {
      this.lowpass.frequency.value = Math.max(200, Math.min(20000, frequency));
    }
  }

  /**
   * 设置处理强度
   */
  setProcessingIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(1, intensity));
    
    if (this.noiseGain) {
      this.noiseGain.gain.value = normalizedIntensity * 0.5;
    }
    
    if (this.bitCrusher) {
      this.bitCrusher.bits.value = Math.max(1, Math.min(16, 16 - normalizedIntensity * 8));
    }
    
    if (this.chorus) {
      this.chorus.wet.value = normalizedIntensity * 0.5;
    }
    
    if (this.distortion) {
      this.distortion.wet.value = normalizedIntensity * 0.3;
    }
  }

  /**
   * 设置播放速度
   */
  setPlaybackRate(rate: number): void {
    if (this.player) {
      this.player.playbackRate = Math.max(0.25, Math.min(2, rate));
    }
  }

  /**
   * 设置低频截止频率
   */
  setLowCutFrequency(frequency: number): void {
    if (this.highpass) {
      this.highpass.frequency.value = Math.max(20, Math.min(500, frequency));
    }
  }

  /**
   * 设置高频截止频率
   */
  setHighCutFrequency(frequency: number): void {
    if (this.lowpass) {
      this.lowpass.frequency.value = Math.max(1000, Math.min(20000, frequency));
    }
  }

  /**
   * 设置温暖度
   */
  setWarmth(warmth: number): void {
    if (this.warmthFilter) {
      this.warmthFilter.gain.value = warmth * 6; // 0-6dB增益
    }
  }

  /**
   * 设置饱和度
   */
  setSaturation(saturation: number): void {
    if (this.saturationDistortion) {
      this.saturationDistortion.distortion = saturation * 0.5;
      this.saturationDistortion.wet.value = saturation * 0.3;
    }
  }

  /**
   * 设置人声抑制强度
   */
  setVocalSuppressionIntensity(intensity: number): void {
    if (this.vocalSuppressor) {
      // 调整中频压缩比来抑制人声
      this.vocalSuppressor.mid.ratio.value = 1 + intensity * 15;
      this.vocalSuppressor.mid.threshold.value = -30 + intensity * 20;
    }
  }

  /**
   * 设置3D空间音频强度
   */
  setSpatialIntensity(intensity: number): void {
    if (this.spatialGain && this.panner3D) {
      this.spatialGain.gain.value = 1 + intensity * 0.5;
      // 创建轻微的3D位置变化
      const x = Math.sin(Date.now() * 0.001) * intensity * 2;
      const z = Math.cos(Date.now() * 0.001) * intensity * 2;
      this.panner3D.positionX.value = x;
      this.panner3D.positionZ.value = z;
    }
  }

  /**
   * 设置ASMR模式
   */
  setAsmrMode(enabled: boolean): void {
    if (this.reverb && this.tremolo) {
      if (enabled) {
        this.reverb.wet.value = 0.4;
        this.reverb.decay = 3.5;
        this.tremolo.wet.value = 0.5;
        this.tremolo.depth.value = 0.4;
      } else {
        this.reverb.wet.value = 0.2;
        this.reverb.decay = 2.5;
        this.tremolo.wet.value = 0.3;
        this.tremolo.depth.value = 0.2;
      }
    }
  }

  /**
   * 设置混响量
   */
  setReverbAmount(amount: number): void {
    if (this.reverb) {
      this.reverb.wet.value = amount;
    }
  }

  /**
   * 设置立体声宽度
   */
  setStereoWidth(width: number): void {
    if (this.stereoWidener) {
      this.stereoWidener.width.value = width;
    }
  }

  /**
   * 获取可用的噪音类型
   */
  getAvailableNoiseTypes() {
    return [
      { value: 'white', label: '白噪音', description: '均匀频谱，适合遮蔽噪音' },
      { value: 'pink', label: '粉噪音', description: '自然平衡，适合学习专注' },
      { value: 'brown', label: '棕噪音', description: '低频丰富，适合深度放松' }
    ];
  }

  /**
   * 获取播放状态
   */
  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      hasAudioLoaded: this.audioBuffer !== null || (this.player?.loaded ?? false),
      currentNoiseType: this.currentNoiseType
    };
  }

  /**
   * 销毁处理器
   */
  dispose(): void {
    this.stopProcessedMusic();
    
    // 销毁所有音频节点
    const nodes = [
      this.player, this.reverb, this.lowpass, this.highpass,
      this.compressor, this.eq, this.bitCrusher, this.chorus,
      this.distortion, this.tremolo, this.noise, this.noiseGain,
      this.stereoWidener, this.panner3D, this.spatialGain,
      this.warmthFilter, this.saturationDistortion, this.vocalSuppressor,
      this.masterGain
    ];
    
    nodes.forEach(node => {
      if (node) {
        node.dispose();
      }
    });
    
    this.isInitialized = false;
    console.log('MusicNoiseProcessor 已销毁');
  }
}