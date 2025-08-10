import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { createGlobalStyle } from 'styled-components';
import original from 'react95/dist/themes/original';
import { styleReset } from 'react95';
import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';
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
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif}') format('woff2');
    font-weight: 400;
    font-style: normal;
  }
  
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif_bold}') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
  
  body {
    font-family: 'ms_sans_serif', sans-serif;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  
  * {
    box-sizing: border-box;
  }
`;

function App() {
  return (
    <div className="black-background">
      <div className="fixed-resolution crt-monitor scanlines">
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
