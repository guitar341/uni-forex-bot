'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Volume, Send } from 'lucide-react';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  isListening: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand, isListening }) => {
  const [transcript, setTranscript] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleStartListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => {
      setIsEnabled(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const trans = event.results[current][0].transcript;
      setTranscript(trans);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.onend = () => {
      setIsEnabled(false);
    };

    recognition.start();
  };

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleSendCommand = () => {
    if (transcript.trim()) {
      onCommand(transcript);
      handleSpeakText(`Executing: ${transcript}`);
      setTranscript('');
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Uni Voice Assistant 🎤</h3>
        <div className="flex items-center gap-2">
          {isListening && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
          {isSpeaking && <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>
      </div>

      {/* Transcript Display */}
      <div className="bg-slate-700/50 p-4 rounded-lg mb-4 min-h-[80px] max-h-[120px] overflow-y-auto">
        <p className="text-sm text-slate-300">{transcript || 'Listening for commands...'}</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleStartListening}
          disabled={isEnabled}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Mic className="w-4 h-4" /> {isEnabled ? 'Listening...' : 'Listen'}
        </button>
        <button
          onClick={handleSendCommand}
          disabled={!transcript.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" /> Send
        </button>
        <button
          onClick={() => handleSpeakText('Uni ready for your command')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Volume2 className="w-4 h-4" /> Speak
        </button>
      </div>

      {/* Command Examples */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Example commands:</p>
        <div className="text-xs text-slate-400 space-y-1">
          <p>• "What's the XAU/USD outlook?"</p>
          <p>• "Execute a buy order"</p>
          <p>• "Close my position"</p>
          <p>• "Show my P&L"</p>
        </div>
      </div>
    </div>
  );
};
