import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// 图片列表 - photos文件夹中的所有图片
const photoList = [
  'N1 (15).png', 'N1 (16).png', 'N1 (17).png', 'N1 (18).png', 'N1 (19).png',
  'N1 (20).png', 'N1 (21).png', 'N1 (22).png', 'N1 (23).png', 'N1 (24).png',
  'N1 (25).png', 'N1 (26).png', 'N1 (27).png', 'N1 (28).png', 'N1 (29).png',
  'N1 (30).png', 'N1 (31).png', 'N1 (32).png', 'N1 (33).png', 'N1 (34).png',
  'N1 (35).png', 'N1 (37).png', 'N1 (38).png', 'N1 (49).png', 'N1 (52).png',
  'N1 (62).png', 'N1 (69).png', 'N1 (71).png', 'N1 (72).png', 'N1 (73).png'
];

// 隧道穿越动画 - 线性几何效果
const tunnelMoveAnimation = keyframes`
  0% {
    transform: translateZ(0) rotateZ(0deg);
    opacity: 1;
  }
  100% {
    transform: translateZ(-2000px) rotateZ(720deg);
    opacity: 0;
  }
`;

// 隧道旋转动画
const tunnelRotateAnimation = keyframes`
  0% {
    transform: rotateZ(0deg);
  }
  100% {
    transform: rotateZ(360deg);
  }
`;

// 线条闪烁动画
const lineFlickerAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
`;

// Glitch故障效果动画
const glitchAnimation = keyframes`
  0%, 100% {
    transform: translate(0);
    filter: hue-rotate(0deg) brightness(1) contrast(1);
  }
  20% {
    transform: translate(-2px, 2px);
    filter: hue-rotate(90deg) brightness(1.2) contrast(1.5);
  }
  40% {
    transform: translate(-2px, -2px);
    filter: hue-rotate(180deg) brightness(0.8) contrast(2);
  }
  60% {
    transform: translate(2px, 2px);
    filter: hue-rotate(270deg) brightness(1.5) contrast(0.8);
  }
  80% {
    transform: translate(2px, -2px);
    filter: hue-rotate(360deg) brightness(0.9) contrast(1.8);
  }
`;

// 网格线动画
const gridLineAnimation = keyframes`
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -100;
  }
`;

// RGB分离效果
const rgbSplitAnimation = keyframes`
  0%, 100% {
    text-shadow: 0 0 0 red, 0 0 0 blue;
  }
  25% {
    text-shadow: -2px 0 0 red, 2px 0 0 blue;
  }
  50% {
    text-shadow: -4px 0 0 red, 4px 0 0 blue;
  }
  75% {
    text-shadow: -2px 0 0 red, 2px 0 0 blue;
  }
`;

// 打字机效果
const typewriterAnimation = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

// 光标闪烁
const blinkAnimation = keyframes`
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
`;

// 图片闪现动画
const photoFlashAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-5deg);
    filter: brightness(0.5) contrast(2) hue-rotate(0deg);
  }
  10% {
    opacity: 1;
    transform: scale(1.2) rotate(2deg);
    filter: brightness(2) contrast(3) hue-rotate(90deg);
  }
  20% {
    opacity: 0.8;
    transform: scale(0.9) rotate(-2deg);
    filter: brightness(1.5) contrast(1.5) hue-rotate(180deg);
  }
  30% {
    opacity: 1;
    transform: scale(1.1) rotate(1deg);
    filter: brightness(2.5) contrast(4) hue-rotate(270deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.7) rotate(3deg);
    filter: brightness(0.3) contrast(1) hue-rotate(360deg);
  }
`;

// 图片故障效果
const photoGlitchAnimation = keyframes`
  0%, 100% {
    transform: translate(0, 0) scale(1);
    filter: hue-rotate(0deg) brightness(1) contrast(1);
  }
  10% {
    transform: translate(-5px, 2px) scale(1.05);
    filter: hue-rotate(90deg) brightness(1.5) contrast(2);
  }
  20% {
    transform: translate(3px, -4px) scale(0.95);
    filter: hue-rotate(180deg) brightness(0.8) contrast(3);
  }
  30% {
    transform: translate(-2px, 3px) scale(1.1);
    filter: hue-rotate(270deg) brightness(2) contrast(1.5);
  }
  40% {
    transform: translate(4px, -1px) scale(0.9);
    filter: hue-rotate(45deg) brightness(1.2) contrast(2.5);
  }
  50% {
    transform: translate(-3px, -2px) scale(1.03);
    filter: hue-rotate(135deg) brightness(0.7) contrast(4);
  }
  60% {
    transform: translate(2px, 4px) scale(1.08);
    filter: hue-rotate(225deg) brightness(1.8) contrast(1.2);
  }
  70% {
    transform: translate(-4px, 1px) scale(0.92);
    filter: hue-rotate(315deg) brightness(1.3) contrast(3.5);
  }
  80% {
    transform: translate(1px, -3px) scale(1.06);
    filter: hue-rotate(60deg) brightness(0.9) contrast(2.8);
  }
  90% {
    transform: translate(-1px, 2px) scale(0.98);
    filter: hue-rotate(120deg) brightness(1.6) contrast(1.8);
  }
`;

// 主容器
const TransitionContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 9999;
  overflow: hidden;
  perspective: 2000px;
  
  /* 确保覆盖整个屏幕 */
  transform: translateZ(0);
  backface-visibility: hidden;
`;

// SVG隧道容器
const TunnelSVGContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
`;

// 隧道SVG
const TunnelSVG = styled.svg<{ isAnimating: boolean; delay: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${props => props.isAnimating ? tunnelMoveAnimation : 'none'} 4s ease-in-out ${props => props.delay}s infinite;
`;

// 旋转网格容器
const RotatingGrid = styled.div<{ isAnimating: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  animation: ${props => props.isAnimating ? tunnelRotateAnimation : 'none'} 8s linear infinite;
`;





// Glitch文字容器
const GlitchTextContainer = styled.div<{ show: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Sango-JA-SVG', monospace;
  font-size: 32px;
  color: #00ff00;
  font-weight: bold;
  white-space: nowrap;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.5s ease;
  z-index: 10;
`;

// Glitch文字
const GlitchText = styled.div<{ isGlitching: boolean }>`
  position: relative;
  display: inline-block;
  animation: ${props => props.isGlitching ? glitchAnimation : 'none'} 0.3s infinite;
  
  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.8;
  }
  
  &::before {
    color: #ff0000;
    animation: ${props => props.isGlitching ? rgbSplitAnimation : 'none'} 0.3s infinite;
    z-index: -1;
  }
  
  &::after {
    color: #0000ff;
    animation: ${props => props.isGlitching ? rgbSplitAnimation : 'none'} 0.3s infinite reverse;
    z-index: -2;
  }
`;

// 打字机文字
const TypewriterText = styled.div<{ isTyping: boolean; duration: number }>`
  overflow: hidden;
  border-right: 2px solid #00ff00;
  white-space: nowrap;
  margin: 0 auto;
  animation: 
    ${props => props.isTyping ? typewriterAnimation : 'none'} ${props => props.duration}s steps(40, end),
    ${blinkAnimation} 0.75s step-end infinite;
  width: ${props => props.isTyping ? '100%' : '0'};
`;

// 隧道背景
const TunnelBackground = styled.div<{ isAnimating: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #000 25%, transparent 25%), 
              linear-gradient(-45deg, #000 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #000 75%), 
              linear-gradient(-45deg, transparent 75%, #000 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  overflow: hidden;
  opacity: 0.1;
`;

// 隧道线条
const TunnelLine = styled.div<{ delay: number; isAnimating: boolean; size: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border: 1px solid #fff;
  transform: translate(-50%, -50%) rotateX(60deg);
  animation: ${props => props.isAnimating ? tunnelMoveAnimation : 'none'} 4s linear ${props => props.delay}s infinite;
  opacity: 0.6;
  
  &:nth-child(odd) {
    border-radius: 0;
    transform: translate(-50%, -50%) rotateX(60deg) rotateZ(45deg);
  }
  
  &:nth-child(even) {
    border-radius: 50%;
  }
`;

// 网格线条
const GridLine = styled.div<{ isAnimating: boolean; direction: 'horizontal' | 'vertical'; position: number }>`
  position: absolute;
  background: #fff;
  opacity: 0.3;
  animation: ${props => props.isAnimating ? gridLineAnimation : 'none'} 2s linear infinite;
  
  ${props => props.direction === 'horizontal' ? `
    width: 100%;
    height: 1px;
    top: ${props.position}%;
    left: 0;
  ` : `
    width: 1px;
    height: 100%;
    left: ${props.position}%;
    top: 0;
  `}
`;



// 粒子效果
const Particle = styled.div<{ x: number; y: number; delay: number; color: string }>`
  position: absolute;
  width: 2px;
  height: 2px;
  background: ${props => props.color};
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  animation: ${tunnelMoveAnimation} 3s ease-in-out ${props => props.delay}s infinite;
  box-shadow: 0 0 6px ${props => props.color};
`;

// 闪现图片容器
const FlashImageContainer = styled.div<{ 
  show: boolean; 
  x: number; 
  y: number; 
  size: number; 
  delay: number;
  duration: number;
}>`
  position: absolute;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  transform: translate(-50%, -50%);
  opacity: ${props => props.show ? 1 : 0};
  z-index: 5;
  pointer-events: none;
  animation: ${props => props.show ? photoFlashAnimation : 'none'} ${props => props.duration}s ease-in-out ${props => props.delay}s;
`;

// 闪现图片
const FlashImage = styled.img<{ isGlitching: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  animation: ${props => props.isGlitching ? photoGlitchAnimation : 'none'} 0.1s infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      rgba(255, 0, 0, 0.2) 0%, 
      rgba(0, 255, 0, 0.2) 33%, 
      rgba(0, 0, 255, 0.2) 66%, 
      rgba(255, 255, 0, 0.2) 100%);
    mix-blend-mode: overlay;
    pointer-events: none;
  }
`;

interface TunnelTransitionProps {
  onComplete: () => void;
}

/**
 * 隧道穿越过渡组件 - 在进入沉浸模式前显示3D隧道效果和glitch文字
 * @param onComplete 过渡完成后的回调函数
 */
const TunnelTransition: React.FC<TunnelTransitionProps> = ({ onComplete }) => {
  const [showText, setShowText] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{x: number, y: number, delay: number, color: string}>>([]);
  const [flashImages, setFlashImages] = useState<Array<{
    src: string;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    show: boolean;
    isGlitching: boolean;
  }>>([]);
  
  const text = "你可以回去，但是那里已经没有人了……";
  
  useEffect(() => {
    // 生成粒子
    const newParticles = [];
    for (let i = 0; i < 80; i++) {
      newParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        color: ['#00ffff', '#ff00ff', '#ffff00', '#ff0080', '#00ff80', '#8000ff'][Math.floor(Math.random() * 6)]
      });
    }
    setParticles(newParticles);
    
    // 生成闪现图片
    const newFlashImages = [];
    for (let i = 0; i < 15; i++) {
      const randomPhoto = photoList[Math.floor(Math.random() * photoList.length)];
      newFlashImages.push({
        src: `/photos/${randomPhoto}`,
        x: Math.random() * 80 + 10, // 10-90% 避免边缘
        y: Math.random() * 80 + 10, // 10-90% 避免边缘
        size: Math.random() * 150 + 100, // 100-250px
        delay: Math.random() * 4 + 0.5, // 0.5-4.5s 延迟
        duration: Math.random() * 1.5 + 0.8, // 0.8-2.3s 持续时间
        show: false,
        isGlitching: Math.random() > 0.5
      });
    }
    setFlashImages(newFlashImages);
    
    // 动画时序控制
    const timer1 = setTimeout(() => {
      setIsAnimating(true);
    }, 300);
    
    // 开始图片闪现
    const timer2 = setTimeout(() => {
      setFlashImages(prev => prev.map(img => ({ ...img, show: true })));
    }, 500);
    
    const timer3 = setTimeout(() => {
      setShowText(true);
    }, 800);
    
    const timer4 = setTimeout(() => {
      setIsTyping(true);
    }, 1000);
    
    const timer5 = setTimeout(() => {
      setIsGlitching(true);
    }, 3200);
    
    const timer6 = setTimeout(() => {
      onComplete();
    }, 5500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [onComplete]);
  
  return (
    <TransitionContainer>
      {/* 隧道背景 */}
      <TunnelBackground isAnimating={isAnimating} />
      
      {/* 隧道线条效果 */}
      {[...Array(12)].map((_, i) => (
        <TunnelLine
          key={`line-${i}`}
          delay={i * 0.1}
          isAnimating={isAnimating}
          size={80 + i * 40}
        />
      ))}
      
      {/* 网格线条效果 */}
      {[...Array(10)].map((_, i) => (
        <GridLine
          key={`h-${i}`}
          isAnimating={isAnimating}
          direction="horizontal"
          position={i * 10}
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <GridLine
          key={`v-${i}`}
          isAnimating={isAnimating}
          direction="vertical"
          position={i * 10}
        />
      ))}
      
      {/* 粒子效果 */}
      {particles.map((particle, i) => (
        <Particle
          key={i}
          x={particle.x}
          y={particle.y}
          delay={particle.delay}
          color={particle.color}
        />
      ))}
      
      {/* 闪现图片 */}
      {flashImages.map((image, index) => (
        <FlashImageContainer
          key={index}
          show={image.show}
          x={image.x}
          y={image.y}
          size={image.size}
          delay={image.delay}
          duration={image.duration}
        >
          <FlashImage
            src={image.src}
            isGlitching={image.isGlitching}
            alt="Memory flash"
          />
        </FlashImageContainer>
      ))}
      
      {/* Glitch文字 */}
      <GlitchTextContainer show={showText}>
        <GlitchText 
          isGlitching={isGlitching} 
          data-text={text}
        >
          <TypewriterText 
            isTyping={isTyping} 
            duration={2}
          >
            {text}
          </TypewriterText>
        </GlitchText>
      </GlitchTextContainer>
    </TransitionContainer>
  );
};

export default TunnelTransition;