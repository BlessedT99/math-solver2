import React, { useState, useEffect } from 'react';
import { Calculator, History, User, LogIn, LogOut, Menu, X, Eye, EyeOff, ChevronDown, ChevronRight, BookOpen, Lightbulb, Clock, Trash2 } from 'lucide-react';

const MathSolver = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('solver');
  const [serverConnected, setServerConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  
  // Math solver state
  const [problem, setProblem] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(false);
  
  // Local storage simulation (replacing localStorage)
  const [users, setUsers] = useState([]);
  const [calculations, setCalculations] = useState([]);

  // API Configuration
  const API_BASE = 'https://math-solver-wi1e.onrender.com';

  // Initialize with sample data
  useEffect(() => {
    const sampleCalculations = [
      {
        id: 1,
        userId: 'demo',
        problem: 'Solve 3x + 2 = 14',
        result: 'x = 4',
        operation: 'solve',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        steps: [
          'Subtract 2 from both sides: 3x + 2 - 2 = 14 - 2',
          'Simplify: 3x = 12',
          'Divide both sides by 3: 3x/3 = 12/3',
          'Simplify: x = 4'
        ]
      },
      {
        id: 2,
        userId: 'demo',
        problem: 'Factor x^2 + 5x + 6',
        result: '(x + 2)(x + 3)',
        operation: 'factor',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        steps: [
          'Look for two numbers that multiply to 6 and add to 5: The numbers are 2 and 3',
          'Check: 2 × 3 = 6, 2 + 3 = 5 ✓',
          'Write as factored form: (x + 2)(x + 3)',
          'Verify by expanding: (x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6 ✓'
        ]
      }
    ];
    setCalculations(sampleCalculations);
    
    // Test server connection on mount
    testServerConnection();
  }, []);

  const testServerConnection = async () => {
    setConnectionStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE}/health`, {
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerConnected(true);
        setConnectionStatus('connected');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setServerConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const handleAuth = () => {
    if (isLogin) {
      // Login logic
      const user = users.find(u => u.username === authForm.username && u.password === authForm.password);
      if (user || authForm.username === 'demo') {
        setCurrentUser(authForm.username === 'demo' ? { username: 'demo', email: 'demo@example.com' } : user);
        setShowAuth(false);
        setAuthForm({ username: '', password: '', email: '' });
      } else {
        alert('Invalid credentials');
      }
    } else {
      // Register logic
      if (users.find(u => u.username === authForm.username)) {
        alert('Username already exists');
        return;
      }
      const newUser = { username: authForm.username, password: authForm.password, email: authForm.email };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setShowAuth(false);
      setAuthForm({ username: '', password: '', email: '' });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('solver');
  };

  const solveProblem = async () => {
    if (!problem.trim()) return;
    
    if (!serverConnected) {
      alert('Server is not connected. Please wait for connection or try again.');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_BASE}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ problem: problem })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const processedResult = {
          originalProblem: data.originalProblem,
          analysis: data.analysis,
          calculation: data.calculation,
          explanation: data.explanation
        };
        
        setResult(processedResult);
        
        // Save to history if user is logged in
        if (currentUser) {
          const newCalculation = {
            id: Date.now(),
            userId: currentUser.username,
            problem: problem,
            result: data.calculation.result,
            operation: data.analysis.operation,
            timestamp: new Date().toISOString(),
            steps: Array.isArray(data.calculation.steps) 
              ? data.calculation.steps 
              : data.calculation.steps.split('\n').filter(step => step.trim())
          };
          setCalculations([newCalculation, ...calculations]);
        }
      } else {
        throw new Error(data.error || 'Unknown error from server');
      }
      
    } catch (error) {
      console.error('Error solving problem:', error);
      // Fallback to local mock solution for demo
      const mockResult = {
        originalProblem: problem,
        analysis: {
          operation: 'solve',
          expression: problem,
          context: 'Local fallback solution (server unavailable)'
        },
        calculation: {
          result: 'x = 4',
          operation: 'solve',
          steps: [
            'Server connection failed - showing demo solution',
            'Subtract 2 from both sides: 3x + 2 - 2 = 14 - 2',
            'Simplify: 3x = 12',
            'Divide both sides by 3: 3x/3 = 12/3',
            'Final answer: x = 4'
          ]
        },
        explanation: 'This is a demo solution since the server is currently unavailable. The actual server would provide AI-powered solutions using Google Gemini.'
      };
      
      setResult(mockResult);
    } finally {
      setLoading(false);
    }
  };

  const userCalculations = calculations.filter(calc => calc.userId === currentUser?.username);

  const exampleProblems = [
    'Find the derivative of x^2 + 3x + 2',
    'Integrate 2x + 3 dx',
    'Factor x^2 + 5x + 6',
    'Simplify (x + 1)^2',
    'Find zeros of x^2 - 4'
  ];

  const deleteCalculation = (id) => {
    setCalculations(calculations.filter(calc => calc.id !== id));
  };

  const ConnectionStatus = () => {
    const statusConfig = {
      checking: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: '🔄 Checking server connection...', icon: '🔄' },
      connected: { color: 'bg-green-100 text-green-800 border-green-200', text: '✅ Connected to server - Ready to solve!', icon: '✅' },
      disconnected: { color: 'bg-red-100 text-red-800 border-red-200', text: '❌ Server unavailable - Using demo mode', icon: '❌' }
    };
    
    const config = statusConfig[connectionStatus];
    
    return (
      <div className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-between ${config.color}`}>
        <span>{config.text}</span>
        {connectionStatus === 'disconnected' && (
          <button 
            onClick={testServerConnection}
            className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${!sidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Mathos AI</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('solver')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'solver' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Calculator className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Math Solver</span>}
          </button>
          
          {currentUser && (
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <History className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">History</span>}
            </button>
          )}
        </div>

        {/* User Section */}
        <div className="mt-auto p-4 border-t border-gray-200">
          {currentUser ? (
            <div className="space-y-3">
              {sidebarOpen && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser.username}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">Log out</span>}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="w-full flex items-center space-x-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">Log in here!</span>}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'solver' && (
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Connection Status */}
              <ConnectionStatus />
              
              {/* Problem Input */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Enter your math problem:</h2>
                <div className="space-y-4">
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Example: Find the derivative of x^2 + 3x + 2"
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={solveProblem}
                    disabled={loading || !problem.trim()}
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Solving...' : '🚀 Solve Problem'}
                  </button>
                </div>
              </div>

              {/* Example Problems */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-blue-800 mb-3">Try these examples:</h3>
                <div className="flex flex-wrap gap-2">
                  {exampleProblems.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setProblem(example)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {result && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 bg-green-50 border-b border-green-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <h3 className="text-lg font-semibold text-green-800">Solution</h3>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Problem:</h4>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{result.originalProblem}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Result:</h4>
                        <p className="text-xl font-mono font-bold text-blue-600 bg-blue-50 p-3 rounded-lg">
                          {result.calculation.result}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4" />
                        <span>Explanation:</span>
                      </h4>
                      <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg leading-relaxed">
                        {result.explanation}
                      </p>
                    </div>

                    <div>
                      <button
                        onClick={() => setExpandedSteps(!expandedSteps)}
                        className="flex items-center space-x-2 font-medium text-blue-600 hover:text-blue-700 mb-3"
                      >
                        {expandedSteps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <BookOpen className="w-4 h-4" />
                        <span>Step-by-Step Solution</span>
                      </button>
                      
                      {expandedSteps && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="space-y-6">
                            {/* Problem Statement */}
                            <div className="border-b border-gray-200 pb-4">
                              <h4 className="text-lg font-semibold text-gray-800 mb-2">Let's solve your equation step-by-step.</h4>
                              <div className="text-xl font-mono text-gray-900 bg-white p-3 rounded border">
                                {result.originalProblem}
                              </div>
                            </div>
                            
                            {/* Steps */}
                            <div className="space-y-5">
                              {(Array.isArray(result.calculation.steps) 
                                ? result.calculation.steps 
                                : result.calculation.steps.split('\n').filter(step => step.trim())
                              ).map((step, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="font-semibold text-gray-800">
                                    Step {index + 1}: {step.includes(':') ? step.split(':')[0] : step}
                                  </div>
                                  {step.includes(':') && (
                                    <div className="ml-4 space-y-2">
                                      <div className="font-mono text-lg bg-white p-3 rounded border">
                                        {step.split(':').slice(1).join(':').trim()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Final Answer */}
                            <div className="border-t border-gray-200 pt-4">
                              <div className="font-semibold text-gray-800 mb-2">Answer:</div>
                              <div className="text-xl font-mono font-bold text-blue-600 bg-white p-4 rounded border-2 border-blue-200">
                                {result.calculation.result}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && currentUser && (
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Calculation History</h2>
              
              {userCalculations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No calculations yet</h3>
                  <p className="text-gray-400">Start solving problems to see your history here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userCalculations.map((calc) => (
                    <div key={calc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{calc.problem}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(calc.timestamp).toLocaleString()}</span>
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {calc.operation}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCalculation(calc.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="font-mono text-lg text-blue-600 font-semibold">{calc.result}</p>
                      </div>
                      
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                          View Steps
                        </summary>
                        <div className="mt-3 space-y-2 pl-4">
                          {(Array.isArray(calc.steps) ? calc.steps : [calc.steps]).map((step, index) => (
                            <div key={index} className="flex space-x-2 text-gray-600">
                              <span className="font-medium">{index + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isLogin ? 'Log In' : 'Sign Up'}
              </h2>
              <button
                onClick={() => setShowAuth(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username (try 'demo')"
                  required
                />
              </div>
              
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (try 'demo')"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleAuth}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Demo:</strong> Use username "demo" and password "demo" to try the app
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathSolver;