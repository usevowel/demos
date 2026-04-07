/**
 * Speaking State Display Component
 * 
 * Showcases the new speaking state tracking feature from Vowel client
 * Displays real-time indicators for:
 * - User speaking (detected via server-side VAD with Deepgram)
 * - AI thinking (processing/tool execution)
 * - AI speaking (delivering audio response)
 */

import { useVowel } from '@vowel.to/client/react';
import { Mic, Brain, Volume2 } from 'lucide-react';

/**
 * Speaking State Display
 * Shows the current speaking state with visual indicators
 */
export function SpeakingStateDisplay() {
  const { state } = useVowel();

  // Don't show if not connected
  if (!state.isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-base-200 rounded-xl shadow-2xl border border-base-300 p-4 max-w-sm">
      <h3 className="text-sm font-bold mb-3 text-base-content/70">
        🎤 Speaking State Tracker
      </h3>
      
      <div className="space-y-2">
        {/* User Speaking Indicator */}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
          state.isUserSpeaking 
            ? 'bg-blue-500/20 border-2 border-blue-500' 
            : 'bg-base-300/50 border-2 border-transparent'
        }`}>
          <div className="relative">
            <Mic className={`w-5 h-5 ${
              state.isUserSpeaking ? 'text-blue-500' : 'text-base-content/40'
            }`} />
            {state.isUserSpeaking && (
              <>
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40" />
                <div className="absolute -inset-1 bg-blue-500/30 rounded-full animate-pulse" />
              </>
            )}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold ${
              state.isUserSpeaking ? 'text-blue-500' : 'text-base-content/60'
            }`}>
              {state.isUserSpeaking ? 'You are speaking' : 'Not speaking'}
            </div>
            <div className="text-xs text-base-content/50">
              Server-side VAD • &lt;200ms latency
            </div>
          </div>
        </div>

        {/* AI Thinking Indicator */}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
          state.isAIThinking 
            ? 'bg-yellow-500/20 border-2 border-yellow-500' 
            : 'bg-base-300/50 border-2 border-transparent'
        }`}>
          <div className="relative">
            <Brain className={`w-5 h-5 ${
              state.isAIThinking ? 'text-yellow-500' : 'text-base-content/40'
            }`} />
            {state.isAIThinking && (
              <>
                <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-40" />
                <div className="absolute -inset-1 bg-yellow-500/30 rounded-full animate-pulse" />
              </>
            )}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold ${
              state.isAIThinking ? 'text-yellow-500' : 'text-base-content/60'
            }`}>
              {state.isAIThinking ? 'AI is thinking' : 'AI idle'}
            </div>
            <div className="text-xs text-base-content/50">
              Processing • Tools execution
            </div>
          </div>
        </div>

        {/* AI Speaking Indicator */}
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
          state.isAISpeaking 
            ? 'bg-purple-500/20 border-2 border-purple-500' 
            : 'bg-base-300/50 border-2 border-transparent'
        }`}>
          <div className="relative">
            <Volume2 className={`w-5 h-5 ${
              state.isAISpeaking ? 'text-purple-500' : 'text-base-content/40'
            }`} />
            {state.isAISpeaking && (
              <>
                <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-40" />
                <div className="absolute -inset-1 bg-purple-500/30 rounded-full animate-pulse" />
              </>
            )}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold ${
              state.isAISpeaking ? 'text-purple-500' : 'text-base-content/60'
            }`}>
              {state.isAISpeaking ? 'AI is speaking' : 'AI silent'}
            </div>
            <div className="text-xs text-base-content/50">
              Audio playback tracking
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-3 pt-3 border-t border-base-300">
        <div className="text-xs text-center">
          {state.isUserSpeaking && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-500 font-semibold">
              🎤 Listening
            </span>
          )}
          {state.isAIThinking && !state.isUserSpeaking && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 font-semibold">
              🧠 Thinking
            </span>
          )}
          {state.isAISpeaking && !state.isAIThinking && !state.isUserSpeaking && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-500 font-semibold">
              🔊 Speaking
            </span>
          )}
          {!state.isUserSpeaking && !state.isAIThinking && !state.isAISpeaking && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-base-content/10 text-base-content/60 font-semibold">
              ✓ Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Speaking State Badge
 * Shows only the current active state in a compact format
 */
export function SpeakingStateBadge() {
  const { state } = useVowel();

  if (!state.isConnected) {
    return null;
  }

  const getStatus = () => {
    if (state.isAISpeaking) return { text: 'AI Speaking', color: 'badge-secondary', icon: '🔊' };
    if (state.isAIThinking) return { text: 'AI Thinking', color: 'badge-warning', icon: '🧠' };
    if (state.isUserSpeaking) return { text: 'Listening', color: 'badge-info', icon: '🎤' };
    return { text: 'Ready', color: 'badge-success', icon: '✓' };
  };

  const status = getStatus();

  return (
    <div className={`badge ${status.color} gap-1 font-semibold`}>
      <span>{status.icon}</span>
      <span>{status.text}</span>
    </div>
  );
}

