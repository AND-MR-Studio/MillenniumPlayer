import React, { useState } from 'react';
import { Button, Panel, TextInput } from 'react95';
import { neteaseApi } from '../services/api';
import AudioControls from './AudioControls';

const ApiTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      setTestResult(`健康检查: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setTestResult(`健康检查失败: ${error}`);
    }
    setLoading(false);
  };

  const testLogin = async () => {
    if (!phone || !password) {
      setTestResult('请输入手机号和密码');
      return;
    }
    
    setLoading(true);
    try {
      const response = await neteaseApi.login(phone, password);
      setTestResult(`登录测试: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setTestResult(`登录测试失败: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <Panel variant='well' style={{ padding: '20px', flex: '1', minWidth: '400px' }}>
        <h3>API 测试面板</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <Button onClick={testHealthCheck} disabled={loading}>
          测试健康检查
        </Button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>手机号:</label>
          <TextInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="输入测试手机号"
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>密码:</label>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </div>
        <Button onClick={testLogin} disabled={loading}>
          测试登录
        </Button>
      </div>
      
      <div>
        <h4>测试结果:</h4>
        <pre style={{ 
          background: '#000', 
          color: '#00ff00', 
          padding: '10px', 
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {testResult || '等待测试...'}
        </pre>
        </div>
      </Panel>
      
      <AudioControls style={{ flex: '1', minWidth: '350px' }} />
    </div>
  );
};

export default ApiTest;