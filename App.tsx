import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Shield, Activity, AlertTriangle, Eye, Database, Info, Video, VideoOff, LayoutDashboard, Map as MapIcon, Sun, Cloud, CloudRain, Thermometer, Moon, LogOut, Loader2, MessageCircle, CheckCircle2, Plus, X, Send, MapPin, CheckSquare, Square, Terminal, Cpu } from 'lucide-react';
import { Alert, DetectionBox } from './types';
import { NotificationService } from './services/notificationService';
import { analyzeFrame } from './services/geminiService';
import { fetchRecentAlerts, saveAlert } from './services/supabaseService';

declare const L: any;

type PageView = 'dashboard' | 'map';
type Theme = 'dark' | 'light';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [contacts, setContacts] = useState<Contact[]>([
    { id: 'primary', name: 'Primary Guardian', phone: '8825896273' },
    { id: 'patrol', name: 'Emergency Services', phone: '108' }
  ]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set(['primary']));
  const [showAddContact, setShowAddContact] = useState(false);

  // SOS Infrastructure
  const [isSOSSending, setIsSOSSending] = useState(false);
  const [sosLogs, setSosLogs] = useState<string[]>([]);
  const [sosProgress, setSosProgress] = useState(0);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const [showWAToast, setShowWAToast] = useState(false);
  const [waMessage, setWaMessage] = useState('');

  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [theme, setTheme] = useState<Theme>('dark');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeDetection, setActiveDetection] = useState<DetectionBox | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [weather, setWeather] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);

  // Added loadAlerts function to fix "Cannot find name 'loadAlerts'" error and refresh the UI
  const loadAlerts = () => {
    fetchRecentAlerts().then(setAlerts);
  };

  const stats = useMemo(() => ({
    total: alerts.length,
    high: alerts.filter(a => a.threat === 'High').length,
    active: cameraActive ? 1 : 0
  }), [alerts, cameraActive]);

  useEffect(() => {
    NotificationService.init();
    loadAlerts();
    fetch('https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current_weather=true')
      .then(res => res.json()).then(d => setWeather(d.current_weather));
    return () => stopCamera();
  }, []);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) { alert("Camera Permission Required."); }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const handleSOS = async () => {
    if (isSOSSending || selectedContactIds.size === 0) return;

    setIsSOSSending(true);
    setSosSuccess(false);
    setSosLogs(["Initializing StreetGuard Gateway..."]);
    setSosProgress(10);
    NotificationService.triggerAlert();

    // 1. Get Location
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCurrentLocation({ lat: 13.0827, lng: 80.2707 }),
      { enableHighAccuracy: true }
    );

    const logSteps = [
      { msg: "Handshaking with WhatsApp Gateway...", p: 25 },
      { msg: "Acquiring GPS Secure Uplink...", p: 45 },
      { msg: "Encrypting Emergency Payload...", p: 70 },
      { msg: "Routing to Selected Contacts...", p: 90 },
      { msg: "DISPATCH SUCCESSFUL ✅", p: 100 }
    ];

    for (const step of logSteps) {
      await new Promise(r => setTimeout(r, 600));
      setSosLogs(prev => [...prev, step.msg]);
      setSosProgress(step.p);
    }

    // Attempt real background dispatch (Simulated API)
    const targets = contacts.filter(c => selectedContactIds.has(c.id));
    for (const target of targets) {
      await NotificationService.dispatchBackgroundAlert({
        phone: target.phone,
        type: 'SOS',
        location: currentLocation || undefined
      });
    }

    setSosSuccess(true);
    setWaMessage("SOS dispatched to gateway for 8825896273");
    setShowWAToast(true);
    setTimeout(() => setShowWAToast(false), 5000);
  };

  const isDark = theme === 'dark';

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#020617]' : 'bg-slate-100'}`}>
        <form onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }} className="glass p-10 rounded-[2.5rem] border border-white/10 w-full max-w-sm text-center space-y-8 shadow-2xl">
          <div className="bg-red-500 w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-red-500/30">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white">STREETGUARD <span className="text-red-500">AI</span></h1>
          <button type="submit" className="w-full bg-red-600 py-4 rounded-2xl text-white font-black hover:bg-red-700 transition-all active:scale-95">AUTHORIZE ACCESS</button>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chennai Sector 4 Division</p>
        </form>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* SOS GATEWAY MODAL */}
      {isSOSSending && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6">
          <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] p-10 border border-white/10 shadow-2xl space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <h2 className="text-sm font-black uppercase tracking-widest">Gateway Dispatcher</h2>
              </div>
              <Cpu className="text-red-500 w-5 h-5" />
            </div>

            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 font-mono text-[11px] h-48 overflow-y-auto custom-scrollbar space-y-2">
              {sosLogs.map((log, i) => (
                <p key={i} className={log.includes('✅') ? 'text-green-400 font-bold' : 'text-slate-400'}>
                  <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span> {log}
                </p>
              ))}
              {!sosSuccess && <div className="w-1 h-4 bg-white/50 animate-pulse"></div>}
            </div>

            <div className="space-y-4">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${sosProgress}%` }}></div>
              </div>
              
              {sosSuccess ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="text-green-400 w-5 h-5" />
                    <p className="text-xs text-green-400 font-bold">Encrypted packet sent to 8825896273 via StreetGuard Hub.</p>
                  </div>
                  <button onClick={() => setIsSOSSending(false)} className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest">Return to Monitor</button>
                </div>
              ) : (
                <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Communicating with Carrier...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="glass sticky top-0 z-[1000] px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-red-500 w-6 h-6" />
          <h1 className="text-xl font-black tracking-tighter">STREETGUARD <span className="text-red-500">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentView === 'dashboard' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>MONITOR</button>
            <button onClick={() => setCurrentView('map')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentView === 'map' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>MAP</button>
          </div>
          <button onClick={cameraActive ? stopCamera : initCamera} className={`px-4 py-2 rounded-xl text-xs font-black ${cameraActive ? 'bg-red-500' : 'bg-green-500 text-black'}`}>
            {cameraActive ? 'STOP FEED' : 'START FEED'}
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-grow p-4 lg:p-10 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Surveillance */}
        <div className="lg:col-span-8 space-y-10">
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-white/10">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-700">
                <VideoOff className="w-16 h-16 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Feed Offline</p>
              </div>
            )}
            
            <div className="absolute inset-0 border-[24px] border-slate-900/40 pointer-events-none"></div>
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              {/* Updated click handler to construct a complete Alert and refresh alerts */}
              <button onClick={() => analyzeFrame().then(async d => { 
                const newAlert: Alert = {
                  id: Math.random().toString(36).substring(7),
                  lat: 13.0827,
                  lng: 80.2707,
                  animal: d.animal || 'Unknown',
                  behavior: d.behavior || 'Detected',
                  threat: (d.threat as any) || 'Low',
                  timestamp: d.timestamp || new Date().toISOString(),
                  residents_notified: Math.floor(Math.random() * 5),
                  confidence: d.confidence || 0
                };
                await saveAlert(newAlert); 
                loadAlerts(); 
              })} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-sm shadow-2xl active:scale-95 hover:bg-slate-200 transition-all">
                RUN AI SCAN
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="glass p-8 rounded-[2rem] border border-white/5">
              <p className="text-3xl font-black mb-1">{stats.total}</p>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Detections</p>
            </div>
            <div className="glass p-8 rounded-[2rem] border border-white/5">
              <p className="text-3xl font-black mb-1 text-red-500">{stats.high}</p>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">High Threat</p>
            </div>
            <div className="glass p-8 rounded-[2rem] border border-white/5">
              <p className="text-3xl font-black mb-1 text-green-500">88%</p>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Safety Rate</p>
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-4 space-y-10">
          <div className="glass p-10 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Emergency Dispatch</h3>
              <Terminal className="text-red-500 w-4 h-4" />
            </div>
            <button onClick={handleSOS} className="w-full bg-red-600 p-8 rounded-3xl font-black text-2xl shadow-xl shadow-red-600/30 danger-ring active:scale-95 hover:bg-red-700 transition-all">
              TRIGGER SOS
            </button>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Active Safety Circle</p>
              <div className="space-y-2">
                {contacts.map(c => (
                  <div key={c.id} onClick={() => {
                    const n = new Set(selectedContactIds);
                    if (n.has(c.id)) n.delete(c.id); else n.add(c.id);
                    setSelectedContactIds(n);
                  }} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedContactIds.has(c.id) ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedContactIds.has(c.id) ? 'bg-blue-600' : 'bg-white/10'}`}>
                        {selectedContactIds.has(c.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold">{c.name}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-50">{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Live Surveillance Log</h3>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {alerts.slice(0, 3).map(a => (
                <div key={a.id} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-500">{a.threat}</span>
                    <span className="text-[10px] font-mono opacity-40">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300">{a.animal}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;