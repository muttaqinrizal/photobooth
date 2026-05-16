"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Wifi, WifiOff, Loader2, X, Check, Grid, Layers, Smartphone, Download, RefreshCcw } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

const LAYOUTS = [
  { id: 'grid', name: 'Modern Grid', icon: Grid, description: '3 foto dalam kotak (1x3)', photos: 3 },
  { id: 'strip', name: 'Classic Strip', icon: Layers, description: 'Strip vertikal klasik', photos: 3 },
  { id: 'single', name: 'Single Portrait', icon: Smartphone, description: '1 foto full frame', photos: 1 },
];

export default function LandingPage() {
  const { socket, isConnected, cameraStatus } = useSocket();
  
  // States
  const [sessionState, setSessionState] = useState('idle'); 
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [countdown, setCountdown] = useState(0);
  const [photos, setPhotos] = useState([]); 
  const [finalResult, setFinalResult] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [liveFrame, setLiveFrame] = useState(null);
  const [error, setError] = useState(null);
  
  const isCapturingRef = useRef(false);

  // Separate Countdown Logic
  useEffect(() => {
    let timer;
    if (sessionState === 'countdown' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (sessionState === 'countdown' && countdown === 0) {
      // Time's up!
      if (!isCapturingRef.current) {
        isCapturingRef.current = true;
        socket?.emit('liveview:stop');
        setTimeout(() => {
          socket?.emit('photo:take');
        }, 800);
      }
    }
    return () => clearInterval(timer);
  }, [sessionState, countdown, socket]);

  // Socket Events Logic
  useEffect(() => {
    if (!socket) return;

    const handleCapturing = () => {
      setSessionState('capturing');
      setLiveFrame(null);
    };

    const handleProcessing = () => {
      setSessionState('processing');
    };

    const handleSuccess = (data) => {
      isCapturingRef.current = false;
      setPhotos(prev => {
        const newPhotos = [...prev, data];
        if (newPhotos.length < selectedLayout.photos) {
          setTimeout(() => {
            setCurrentPhotoIndex(newPhotos.length);
            setCountdown(5);
            setSessionState('countdown');
            socket.emit('liveview:start');
          }, 2000);
        } else {
          socket.emit('photo:finalize', { photos: newPhotos, layout: selectedLayout.id });
        }
        return newPhotos;
      });
    };

    const handleFinalized = (data) => {
      setFinalResult(data);
      setSessionState('result');
    };

    const handleError = (data) => {
      isCapturingRef.current = false;
      setError(data.message);
      setSessionState('idle');
      setTimeout(() => setError(null), 5000);
    };

    socket.on('photo:capturing', handleCapturing);
    socket.on('photo:processing', handleProcessing);
    socket.on('photo:success', handleSuccess);
    socket.on('photo:finalized', handleFinalized);
    socket.on('photo:error', handleError);
    socket.on('liveview:frame', (frame) => setLiveFrame(frame));

    return () => {
      socket.off('photo:capturing', handleCapturing);
      socket.off('photo:processing', handleProcessing);
      socket.off('photo:success', handleSuccess);
      socket.off('photo:finalized', handleFinalized);
      socket.off('photo:error', handleError);
      socket.off('liveview:frame');
    };
  }, [socket, selectedLayout]);

  const startSession = () => {
    if (!cameraStatus.connected) {
      setError("Kamera belum terdeteksi. Cek kabel USB!");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSessionState('layout-select');
  };

  const confirmLayout = (layout) => {
    setSelectedLayout(layout);
    setPhotos([]);
    setFinalResult(null);
    setCurrentPhotoIndex(0);
    isCapturingRef.current = false;
    
    // Start First Photo
    setCountdown(5);
    setSessionState('countdown');
    socket?.emit('liveview:start');
  };

  const resetSession = () => {
    setSessionState('idle');
    setPhotos([]);
    setFinalResult(null);
    setCurrentPhotoIndex(0);
    setLiveFrame(null);
    isCapturingRef.current = false;
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden selection:bg-white/20 font-sans">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ opacity: 0.15 }} className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[180px]" />
        <motion.div animate={{ opacity: 0.15 }} className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-600 rounded-full blur-[180px]" />
      </div>

      {/* Top Status Indicators */}
      <div className="fixed top-0 left-0 right-0 p-10 flex justify-between items-start z-50 pointer-events-none">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2 pointer-events-auto">
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-3xl transition-all duration-500 ${cameraStatus.connected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <Camera size={16} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">{cameraStatus.connected ? cameraStatus.model : 'System Offline'}</span>
          </div>
        </motion.div>

        {sessionState !== 'idle' && sessionState !== 'layout-select' && sessionState !== 'result' && (
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-3xl px-8 py-4 rounded-full border border-white/10 text-white shadow-2xl">
            <span className="text-[10px] tracking-[0.4em] uppercase font-black opacity-40">{selectedLayout.name}</span>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex gap-3">
              {[...Array(selectedLayout.photos)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all duration-700 ${i < photos.length ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : i === currentPhotoIndex ? 'bg-white animate-pulse scale-125' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-3xl pointer-events-auto ${isConnected ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'bg-orange-400'}`} />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">{isConnected ? 'Server Online' : 'Connecting...'}</span>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xl px-4">
            <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-3xl p-5 rounded-3xl flex items-center gap-5 text-red-400">
              <Camera size={24} />
              <p className="flex-1 text-sm font-bold uppercase tracking-wider leading-relaxed">{error}</p>
              <button onClick={() => setError(null)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 w-full flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          
          {/* IDLE STATE */}
          {sessionState === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col items-center text-center z-10 px-6">
              <div className="mb-20">
                <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-800 leading-none drop-shadow-2xl">PHOTOBOOTH</h1>
                <p className="text-zinc-500 text-[10px] md:text-sm font-black tracking-[1.2em] uppercase mt-8 opacity-60">Professional Studio Experience</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={startSession} className="group relative flex flex-col items-center gap-16">
                <div className="relative w-48 h-48 flex items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl group-hover:bg-white/10 group-hover:border-white/30 transition-all duration-700 shadow-2xl">
                  <Camera className="text-white w-20 h-20 group-hover:rotate-12 transition-transform duration-500" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-white rounded-full blur-3xl" />
                </div>
                <span className="text-3xl font-light tracking-[0.6em] uppercase text-white/40 group-hover:text-white transition-all duration-500">Sentuh untuk Mulai</span>
              </motion.button>
            </motion.div>
          )}

          {/* LAYOUT SELECT STATE */}
          {sessionState === 'layout-select' && (
            <motion.div key="layout-select" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col items-center z-10 w-full max-w-7xl px-10">
              <div className="text-center mb-20">
                <h2 className="text-5xl font-black tracking-[0.3em] text-white uppercase mb-4">Pilih Gaya</h2>
                <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Sesuaikan tampilan fotomu</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
                {LAYOUTS.map((layout) => (
                  <motion.button
                    key={layout.id}
                    whileHover={{ y: -15, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => confirmLayout(layout)}
                    className="flex flex-col items-center gap-10 p-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[50px] hover:bg-white/10 hover:border-white/40 transition-all text-left group relative overflow-hidden"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                      <layout.icon size={48} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">{layout.name}</h3>
                      <p className="text-zinc-500 text-sm font-medium tracking-wide leading-relaxed">{layout.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* COUNTDOWN STATE (FULLSCREEN VIEW) */}
          {sessionState === 'countdown' && (
            <motion.div 
              key="countdown" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 flex items-center justify-center z-[100] bg-black"
            >
              {/* Live Viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                {liveFrame ? (
                  <img src={liveFrame} alt="Live" className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <Loader2 className="w-16 h-16 text-white/20 animate-spin" />
                    <span className="text-white/20 text-xs tracking-[0.5em] uppercase font-black">Menghubungkan Kamera...</span>
                  </div>
                )}
                {/* Subtle Overlay for contrast */}
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Countdown Text */}
              <motion.div 
                key={countdown} 
                initial={{ opacity: 0, scale: 0.5 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 2 }} 
                className="relative z-20 pointer-events-none"
              >
                <span className="text-[35rem] font-black text-white drop-shadow-[0_0_150px_rgba(0,0,0,0.6)] leading-none tabular-nums">
                  {countdown}
                </span>
              </motion.div>

              {/* Status Info (Top) */}
              <div className="absolute top-12 left-0 right-0 flex flex-col items-center gap-4 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10">
                  <span className="text-white text-sm font-black tracking-[0.8em] uppercase">Pose {photos.length + 1} / {selectedLayout.photos}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {(sessionState === 'capturing' || sessionState === 'processing') && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-16 z-10">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="w-48 h-48 border-t-2 border-white/60 rounded-full" />
                <Camera className="absolute inset-0 m-auto text-white w-16 h-16" />
              </div>
              <div className="text-center">
                <h2 className="text-5xl font-black tracking-[0.4em] text-white uppercase mb-4">{sessionState === 'capturing' ? 'Jepret!' : 'Menyusun Foto...'}</h2>
                <p className="text-zinc-500 text-sm tracking-[0.5em] uppercase font-bold">Kreativitas sedang berjalan</p>
              </div>
            </motion.div>
          )}

          {/* RESULT STATE */}
          {sessionState === 'result' && finalResult && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full h-full flex flex-col items-center justify-center p-16 gap-16 z-10 overflow-y-auto">
              <div className="flex-1 w-full max-w-5xl flex items-center justify-center">
                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative group rounded-[40px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] border border-white/10 max-h-[70vh]">
                    <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${finalResult.ready}`} alt="Final Layout" className="max-h-[70vh] w-auto object-contain" />
                 </motion.div>
              </div>
              <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-20 p-12 bg-white/5 backdrop-blur-3xl rounded-[60px] border border-white/10">
                <div className="p-5 bg-white rounded-[32px] shadow-2xl">
                  <img src={finalResult.qr} alt="QR" className="w-40 h-40" />
                </div>
                <div className="flex flex-col gap-6">
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Selesai!</h3>
                  <button onClick={resetSession} className="flex items-center justify-center gap-3 px-12 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all">
                    <RefreshCcw size={20} />
                    Mulai Lagi
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-12 text-zinc-800 text-[11px] font-black tracking-[0.8em] uppercase z-10 opacity-40">Sony ZV-E10 Pro Studio</div>
    </main>
  );
}
