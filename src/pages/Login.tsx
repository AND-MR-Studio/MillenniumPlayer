import React, { useState, useEffect } from 'react';
import {
  Window,
  WindowContent,
  WindowHeader,
  Button,
  TextInput,
  Panel,
  ProgressBar,
  Divider,
  Tabs,
  Tab,
  TabBody
} from 'react95';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { neteaseApi, formatUser, CookieManager } from '../services/api';

// 检查登录状态
const checkLoginStatus = async () => {
  try {
    const response = await neteaseApi.checkLoginStatus();
    return response.data?.profile || null;
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return null;
  }
};

// 保存登录cookie
const saveLoginCookie = (userInfo: any) => {
  try {
    localStorage.setItem('netease_user', JSON.stringify(userInfo));
    localStorage.setItem('netease_login_time', Date.now().toString());
  } catch (error) {
    console.error('保存登录信息失败:', error);
  }
};

// 获取保存的登录信息
const getSavedLoginInfo = () => {
  try {
    const userStr = localStorage.getItem('netease_user');
    const loginTime = localStorage.getItem('netease_login_time');
    
    if (userStr && loginTime) {
      const user = JSON.parse(userStr);
      const time = parseInt(loginTime);
      const now = Date.now();
      
      // 检查是否在7天内
      if (now - time < 7 * 24 * 60 * 60 * 1000) {
        return user;
      }
    }
    return null;
  } catch (error) {
    console.error('获取保存的登录信息失败:', error);
    return null;
  }
};

// 拨号连接动画
const dialAnimation = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const LoginContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'MS Sans Serif', sans-serif;
`;

const LoginWindow = styled(Window)`
  width: 450px;
  min-height: 400px;
`;

const DialStatus = styled.div`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  animation: ${dialAnimation} 1.5s infinite;
  margin: 10px 0;
`;

const FormGroup = styled.div`
  margin: 15px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: bold;
`;

const StatusText = styled.div`
  font-size: 11px;
  color: #666;
  margin: 5px 0;
`;

const ErrorText = styled.div`
  font-size: 11px;
  color: #ff0000;
  margin: 10px 0;
  padding: 8px;
  background: #ffe0e0;
  border: 1px solid #ff9999;
  border-radius: 2px;
  line-height: 1.4;
`;

const WarningText = styled.div`
  font-size: 11px;
  color: #cc6600;
  margin: 10px 0;
  padding: 8px;
  background: #fff8e0;
  border: 1px solid #ffcc99;
  border-radius: 2px;
  line-height: 1.4;
`;



const GuestInfo = styled.div`
  background: #f0f0f0;
  border: 2px inset #c0c0c0;
  padding: 15px;
  margin: 10px 0;
  font-size: 12px;
  line-height: 1.4;
`;

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
  const navigate = useNavigate();
  const { setUser, setGuestMode, setCurrentPage } = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [phone, setPhone] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('准备连接到网易云音乐服务器...');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'normal' | 'security' | 'network'>('normal');
  const [isSendingCaptcha, setIsSendingCaptcha] = useState(false);
  const [captchaSent, setCaptchaSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // 检查登录状态
  useEffect(() => {
    const checkExistingLogin = async () => {
      setIsCheckingLogin(true);
      setStatusMessage('检查登录状态...');
      
      try {
        // 首先检查本地保存的登录信息
        const savedUser = getSavedLoginInfo();
        if (savedUser) {
          // 验证服务器端登录状态
          const serverUser = await checkLoginStatus();
          if (serverUser) {
            const user = formatUser(serverUser);
            setUser(user);
            setCurrentPage('desktop');
            setStatusMessage('已登录，正在进入桌面...');
            setTimeout(() => {
              navigate('/desktop');
            }, 1000);
            return;
          } else {
            // 服务器端登录已过期，清除本地信息
            localStorage.removeItem('netease_user');
            localStorage.removeItem('netease_login_time');
          }
        }
        
        setStatusMessage('准备连接到网易云音乐服务器...');
      } catch (error) {
        console.error('检查登录状态失败:', error);
        setStatusMessage('准备连接到网易云音乐服务器...');
      } finally {
        setIsCheckingLogin(false);
      }
    };
    
    checkExistingLogin();
  }, [navigate, setUser, setCurrentPage]);
  


  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);



  // 模拟拨号连接过程
  const simulateDialUp = async () => {
    const steps = [
      { message: '正在拨号...', duration: 1000 },
      { message: '检测调制解调器...', duration: 800 },
      { message: '建立连接...', duration: 1200 },
      { message: '验证用户身份...', duration: 1500 },
      { message: '获取用户信息...', duration: 1000 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setStatusMessage(steps[i].message);
      setProgress((i + 1) * 20);
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
    }
  };



  // 处理错误信息
  const handleError = (error: any, context: string) => {
    console.error(`${context}错误:`, error);
    
    let errorMessage = error.message || '网络连接失败';
    let type: 'normal' | 'security' | 'network' = 'normal';
    
    // 检查是否为8810安全风险错误
    if (errorMessage.includes('当前网络环境存在安全风险')) {
      type = 'security';
      errorMessage = '网络安全检测失败\n\n可能的解决方案：\n• 稍后重试（推荐）\n• 更换网络环境\n• 使用移动网络\n• 关闭VPN或代理';
    } else if (errorMessage.includes('网络') || errorMessage.includes('连接') || errorMessage.includes('超时')) {
      type = 'network';
    }
    
    setError(errorMessage);
    setErrorType(type);
  };

  // 发送验证码
  const sendCaptcha = async () => {
    if (!phone) {
      setError('请输入手机号');
      setErrorType('normal');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号格式');
      setErrorType('normal');
      return;
    }

    setIsSendingCaptcha(true);
    setError('');
    setErrorType('normal');

    try {
      const response = await neteaseApi.sendCaptcha(phone);
      if (response.code === 200) {
        setCaptchaSent(true);
        setCountdown(60);
        setStatusMessage('验证码已发送，请查收短信');
        setRetryCount(0); // 重置重试计数
      } else {
        throw new Error('发送验证码失败');
      }
    } catch (error: any) {
      handleError(error, '发送验证码');
    } finally {
      setIsSendingCaptcha(false);
    }
  };

  // 验证码登录
  const handleCaptchaLogin = async () => {
    if (!phone) {
      setError('请输入手机号');
      setErrorType('normal');
      return;
    }

    if (!captcha) {
      setError('请输入验证码');
      setErrorType('normal');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号格式');
      setErrorType('normal');
      return;
    }

    setError('');
    setErrorType('normal');
    setIsConnecting(true);
    setProgress(0);

    try {
      await simulateDialUp();
      
      const response = await neteaseApi.loginByCaptcha(phone, captcha);
      if (response.code === 200 && response.profile) {
        const user = formatUser(response.profile);
        user.phone = phone;
        
        // 保存登录信息
        saveLoginCookie(user);
        
        setUser(user);
        setCurrentPage('desktop');
        
        setStatusMessage('连接成功！正在进入桌面...');
        setProgress(100);
        setRetryCount(0); // 重置重试计数
        
        setTimeout(() => {
          navigate('/desktop');
        }, 1000);
      } else {
        throw new Error('登录失败');
      }
    } catch (error: any) {
      handleError(error, '登录');
      setIsConnecting(false);
      setProgress(0);
      setStatusMessage('连接失败，请重试');
      setRetryCount(prev => prev + 1);
    }
  };

  // 重试登录
  const handleRetry = () => {
    setError('');
    setErrorType('normal');
    if (errorType === 'security') {
      // 对于安全风险错误，清除cookie重新开始
      CookieManager.clearCookie();
    }
  };

  // 游客登录
  const handleGuestLogin = async () => {
    setError('');
    setIsConnecting(true);
    setProgress(0);
    setStatusMessage('正在进入游客模式...');

    try {
      // 模拟连接过程
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setGuestMode(true);
      setCurrentPage('desktop');
      setStatusMessage('游客模式连接成功！');
      
      setTimeout(() => {
        navigate('/desktop');
      }, 500);
    } catch (error: any) {
      console.error('游客登录错误:', error);
      setError('进入游客模式失败');
      setIsConnecting(false);
      setProgress(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isConnecting && activeTab === 0) {
      handleCaptchaLogin();
    }
  };

  return (
    <LoginContainer>
      <LoginWindow>
        <WindowHeader active={true}>
          <span>网络连接 - 千禧复古音乐播放器</span>
        </WindowHeader>
        <WindowContent>
          <Panel variant='well' style={{ padding: '15px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>拨号网络连接</h3>
            
            {isCheckingLogin ? (
              <>
                <DialStatus>{statusMessage}</DialStatus>
                <ProgressBar value={50} />
                <StatusText>
                  正在检查登录状态...
                </StatusText>
              </>
            ) : !isConnecting ? (
              <>
                <Tabs value={activeTab} onChange={setActiveTab}>
                  <Tab value={0}>验证码登录</Tab>
                  <Tab value={1}>游客模式</Tab>
                </Tabs>
                
                <TabBody style={{ marginTop: '15px' }}>
                  {activeTab === 0 && (
                    <>
                      <FormGroup>
                        <Label>网易云账号（手机号）:</Label>
                        <TextInput
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="请输入手机号"
                          disabled={isConnecting}
                          onKeyPress={handleKeyPress}
                        />
                      </FormGroup>
                      
                      <FormGroup>
                        <Label>验证码:</Label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <TextInput
                            value={captcha}
                            onChange={(e) => setCaptcha(e.target.value)}
                            placeholder="请输入验证码"
                            disabled={isConnecting}
                            onKeyPress={handleKeyPress}
                            style={{ flex: 1 }}
                          />
                          <Button
                            onClick={sendCaptcha}
                            disabled={isSendingCaptcha || countdown > 0 || isConnecting}
                            style={{ minWidth: '80px' }}
                          >
                            {countdown > 0 ? `${countdown}s` : isSendingCaptcha ? '发送中...' : '发送验证码'}
                          </Button>
                        </div>
                      </FormGroup>
                      
                      {captchaSent && (
                        <StatusText style={{ color: '#008000' }}>
                          验证码已发送到 {phone}，请查收短信
                        </StatusText>
                      )}
                      
                      <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <Button
                          onClick={handleCaptchaLogin}
                          disabled={isConnecting || isCheckingLogin}
                          style={{ minWidth: '100px', width: '100%' }}
                        >
                          连接
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 1 && (
                    <>
                      <GuestInfo>
                        <strong>游客模式说明：</strong><br/>
                        • 无需登录即可体验音乐播放器<br/>
                        • 内置演示音乐，支持lofi效果调节<br/>
                        • 可体验沉浸式播放界面<br/>
                        • 功能受限，建议登录获得完整体验
                      </GuestInfo>
                      
                      <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <Button
                          onClick={handleGuestLogin}
                          disabled={isConnecting || isCheckingLogin}
                          style={{ minWidth: '100px', width: '100%' }}
                        >
                          进入游客模式
                        </Button>
                      </div>
                    </>
                  )}
                </TabBody>
                
                {error && (
                  <>
                    {errorType === 'security' ? (
                      <ErrorText>
                        <strong>⚠️ 安全检测失败</strong><br/>
                        {error.split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index < error.split('\n').length - 1 && <br/>}
                          </span>
                        ))}
                        {retryCount > 0 && (
                          <>
                            <br/><br/>
                            <small>已重试 {retryCount} 次</small>
                          </>
                        )}
                      </ErrorText>
                    ) : errorType === 'network' ? (
                      <WarningText>
                        <strong>🌐 网络连接问题</strong><br/>
                        {error}
                        <br/><br/>
                        <small>建议检查网络连接后重试</small>
                      </WarningText>
                    ) : (
                      <StatusText style={{ color: '#ff0000', marginTop: '10px' }}>
                        错误: {error}
                      </StatusText>
                    )}
                    
                    {(errorType === 'security' || errorType === 'network') && (
                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <Button
                          onClick={handleRetry}
                          disabled={isConnecting}
                          style={{ minWidth: '80px' }}
                        >
                          重试
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <DialStatus>{statusMessage}</DialStatus>
                <ProgressBar value={progress} />
                <StatusText>
                  正在建立连接...
                </StatusText>
                <StatusText>
                  请稍候，这可能需要几秒钟时间。
                </StatusText>
              </>
            )}
          </Panel>
        </WindowContent>
      </LoginWindow>
    </LoginContainer>
  );
};

export default Login;