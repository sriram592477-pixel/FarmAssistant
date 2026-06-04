import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sprout, Eye, EyeOff, User, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

const InputField = ({ icon: Icon, type, placeholder, value, onChange, label, showToggle, onToggle, showPass }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={showToggle ? (showPass ? 'text' : 'password') : type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500 focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-400 text-sm"
      />
      {showToggle && (
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  </div>
);

const Login = () => {
  const { login, signup, language, setLanguage, t } = useAppContext();
  const [activeTab, setActiveTab] = useState('login');

  // Login state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Sign up state
  const [signupForm, setSignupForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' });
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const result = login(loginForm.username, loginForm.password);
    if (!result.success) setLoginError(result.message);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }
    if (signupForm.password.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    const result = signup(signupForm);
    if (result.success) {
      setSignupSuccess('Account created! You can now log in.');
      setSignupForm({ name: '', email: '', username: '', password: '', confirmPassword: '' });
      setTimeout(() => setActiveTab('login'), 1500);
    } else {
      setSignupError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-[-5%] right-[-10%] w-[400px] h-[400px] bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[30%] w-[450px] h-[450px] bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000" />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-twinkle"
            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-gradient-to-br from-nature-400 to-emerald-600 rounded-2xl shadow-xl shadow-emerald-900/40 mb-4">
            <Sprout className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Karshaka AI</h1>
          <p className="text-sm text-blue-300 mt-1">AI-Powered Farming Assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Tabs */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-8">
            {['login', 'signup'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setLoginError(''); setSignupError(''); setSignupSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-white text-gray-800 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {tab === 'login' ? '🔑 Sign In' : '✨ Sign Up'}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-blue-300 mb-1.5 uppercase tracking-wider">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:ring-2 focus:ring-nature-400 outline-none transition-all"
            >
              <option value="en" className="text-gray-800">🇬🇧 English</option>
              <option value="ta" className="text-gray-800">🇮🇳 தமிழ் (Tamil)</option>
              <option value="hi" className="text-gray-800">🇮🇳 हिन्दी (Hindi)</option>
              <option value="ml" className="text-gray-800">🇮🇳 മലയാളം (Malayalam)</option>
            </select>
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                  <input
                    type="text" required value={loginForm.username}
                    onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="e.g. farmer_john"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:ring-2 focus:ring-nature-400 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                  <input
                    type={showLoginPass ? 'text' : 'password'} required value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:ring-2 focus:ring-nature-400 focus:border-transparent outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowLoginPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-nature-500 to-emerald-600 hover:from-nature-400 hover:to-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-800/60 hover:-translate-y-0.5 active:translate-y-0"
              >
                Sign In →
              </button>
              <p className="text-center text-xs text-white/40">Demo: any username + password (min 4 chars)</p>
            </form>
          )}

          {/* SIGNUP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              {[
                { label: 'Full Name', icon: User, type: 'text', key: 'name', placeholder: 'John Doe' },
                { label: 'Email', icon: Mail, type: 'email', key: 'email', placeholder: 'john@example.com' },
                { label: 'Username', icon: User, type: 'text', key: 'username', placeholder: 'farmer_john' },
              ].map(({ label, icon: Icon, type, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-blue-200 mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                    <input
                      type={type} required value={signupForm[key]}
                      onChange={e => setSignupForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:ring-2 focus:ring-nature-400 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
              {[
                { label: 'Password', key: 'password', show: showSignupPass, toggle: () => setShowSignupPass(p => !p) },
                { label: 'Confirm Password', key: 'confirmPassword', show: showConfirmPass, toggle: () => setShowConfirmPass(p => !p) },
              ].map(({ label, key, show, toggle }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-blue-200 mb-1.5">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                    <input
                      type={show ? 'text' : 'password'} required value={signupForm[key]}
                      onChange={e => setSignupForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:ring-2 focus:ring-nature-400 focus:border-transparent outline-none transition-all"
                    />
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {signupError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{signupError}</span>
                </div>
              )}
              {signupSuccess && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{signupSuccess}</span>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/40 hover:shadow-blue-800/60 hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                Create Account ✨
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">© 2026 Karshaka AI. Smart Agriculture Platform.</p>
      </div>
    </div>
  );
};

export default Login;
