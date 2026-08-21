'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '528796') {
      document.cookie = "admin_auth=true; path=/";
      router.push('/admin');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '2rem' }}>Bkam El-Naharda Admin - تسجيل الدخول</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="أدخل كلمة المرور" 
          className="input"
          required
        />
        {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}
        <button type="submit" className="btn btn-primary">دخول</button>
      </form>
    </div>
  );
}
