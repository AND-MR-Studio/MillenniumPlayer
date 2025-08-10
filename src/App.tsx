import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { createGlobalStyle } from 'styled-components';
import original from 'react95/dist/themes/original';
import { styleReset } from 'react95';
import './styles/global.css';

import Startup from './pages/Startup';
import Login from './pages/Login';
import Desktop from './pages/Desktop';
import Immersive from './pages/Immersive';
import ApiTest from './components/ApiTest';

// 全局样式
const GlobalStyles = createGlobalStyle`
  ${styleReset}
  
  @font-face {
    font-family: 'Sango-JA-SVG';
    src: url('/fonts/Sango-JA-SVG.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
  
  body {
    font-family: 'Sango-JA-SVG', sans-serif;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  
  * {
    box-sizing: border-box;
  }
`;

/**
 * 主应用组件 - 包含glitch视差和鱼眼变形效果
 * @returns {JSX.Element} 应用程序根组件
 */
function App() {
  return (
    <div className="black-background">
      <div className="fixed-resolution crt-monitor scanlines">
        {/* 添加glitch干扰条纹层 */}
        <div className="glitch-lines"></div>
        
        {/* 视差背景层 */}
        <div className="parallax-layer parallax-layer-1"></div>
        <div className="parallax-layer parallax-layer-2"></div>
        <div className="parallax-layer parallax-layer-3"></div>
        
        <ThemeProvider theme={original}>
          <GlobalStyles />
          <Router>
            <Routes>
              <Route path="/" element={<Startup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/desktop" element={<Desktop />} />
              <Route path="/immersive" element={<Immersive />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </div>
    </div>
  );
}

export default App;
