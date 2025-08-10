import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// 老式显示器容器
const MonitorContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'MS Sans Serif', sans-serif;
  position: relative;
  overflow: hidden;
`;

// 4:3 显示器屏幕
const MonitorScreen = styled.div`
  width: 90%;
  height: 90%;
  background: #000080;
  border: 15px solid #2a2a2a;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 
    inset 0 0 15px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(0, 0, 0, 0.5);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      transparent 50%,
      rgba(0, 255, 0, 0.03) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 10;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    pointer-events: none;
    z-index: 5;
  }
`;

// 蓝屏内容
const BlueScreenContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000080;
  color: #ffffff;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 1;
`;

// 闪烁动画
const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

// 主标题
const MainTitle = styled.h1`
  font-size: 48px;
  font-weight: bold;
  margin: 0 0 30px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
`;

// 副标题
const SubTitle = styled.h2`
  font-size: 24px;
  margin: 0 0 40px 0;
  opacity: 0.9;
  font-weight: normal;
`;

// 系统信息
const SystemInfo = styled.div`
  font-size: 14px;
  line-height: 1.6;
  margin: 40px 0;
  text-align: left;
  font-family: 'Courier New', monospace;
  opacity: 0.8;
  
  .line {
    margin: 5px 0;
  }
`;

// 进度条容器
const ProgressContainer = styled.div`
  width: 400px;
  margin: 40px 0;
  text-align: center;
`;

// 进度条
const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 20px;
  background: #c0c0c0;
  border: 2px inset #c0c0c0;
  margin: 10px 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    height: 16px;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #0000ff, #4040ff);
    transition: width 0.3s ease;
  }
`;

// 进度文本
const ProgressText = styled.div`
  font-size: 12px;
  margin: 10px 0;
  opacity: 0.9;
`;

// 光标
const Cursor = styled.span`
  animation: ${blink} 1s infinite;
  font-weight: bold;
`;

// 底部提示
const BottomHint = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  opacity: 0.7;
  text-align: center;
`;

const Startup: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const loadingSteps = [
    '正在初始化千禧复古音乐系统...',
    '检测网易云音乐服务...',
    '加载Win95界面组件...',
    '准备音频处理引擎...',
    '配置沉浸式播放环境...',
    '系统准备完成！'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // 更新当前步骤
        const stepIndex = Math.floor(newProgress / 16.67); // 100/6 ≈ 16.67
        if (stepIndex < loadingSteps.length) {
          setCurrentStep(stepIndex);
        }
        
        // 完成加载
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return 100;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [navigate]);

  // 光标闪烁效果
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <MonitorContainer>
      <MonitorScreen>
        <BlueScreenContent>
          <MainTitle>你回来了，现在是2000年</MainTitle>
          <SubTitle>千禧复古音乐播放器</SubTitle>
          
          <SystemInfo>
            <div className="line">Microsoft Windows 95</div>
            <div className="line">NetEase Cloud Music Integration v1.0</div>
            <div className="line">LoFi Audio Processing Engine</div>
            <div className="line">Immersive Visualization System</div>
            <div className="line">---</div>
            <div className="line">内存: 64MB RAM</div>
            <div className="line">处理器: Intel Pentium 200MHz</div>
            <div className="line">显卡: S3 Trio64V+ 4MB</div>
            <div className="line">声卡: Sound Blaster 16</div>
          </SystemInfo>
          
          <ProgressContainer>
            <ProgressText>
              {loadingSteps[currentStep] || '加载中...'}
              {showCursor && <Cursor>_</Cursor>}
            </ProgressText>
            <ProgressBar progress={progress} />
            <ProgressText>{Math.round(progress)}% 完成</ProgressText>
          </ProgressContainer>
          
          <BottomHint>
            正在连接到千禧年的网络世界...<br />
            请稍候，系统正在为您准备复古音乐体验
          </BottomHint>
        </BlueScreenContent>
      </MonitorScreen>
    </MonitorContainer>
  );
};

export default Startup;