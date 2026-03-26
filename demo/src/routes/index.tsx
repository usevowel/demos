/**
 * Home page - Demo of Vowel speaking state tracking
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useVowel } from '@vowel.to/client/react'
import { Mic, Brain, Volume2, ArrowRight } from 'lucide-react'

function HomePage() {
  const { state, toggleSession } = useVowel();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl">
        <div className="hero-content text-center py-16">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center justify-center gap-2">
              <span style={{ fontFamily: 'OCR-A, monospace' }}>vowel</span>
              <span>|</span>
              <span>shop</span>
            </h1>
            <p className="py-6 text-lg">
              Experience voice-powered shopping with real-time speaking state tracking!
              Start a voice session to see the AI respond to your requests.
            </p>
            
            {!state.isConnected ? (
              <button 
                onClick={toggleSession}
                disabled={state.isConnecting}
                className="btn btn-primary btn-lg gap-2"
              >
                <Mic className="w-5 h-5" />
                {state.isConnecting ? 'Connecting...' : 'Start Voice Session'}
              </button>
            ) : (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Voice session active! Try saying "Show me the products" or "Add product to cart"</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Feature Highlight */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">
            🎉 New Feature: Speaking State Tracking
          </h2>
          <p className="text-base-content/70">
            The Vowel client now tracks three distinct states during voice conversations:
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {/* User Speaking */}
            <div className="card bg-blue-500/10 border-2 border-blue-500/30">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-6 h-6 text-blue-500" />
                  <h3 className="card-title text-lg">User Speaking</h3>
                </div>
                <p className="text-sm">
                  Detected via client-side Voice Activity Detection (VAD) with <strong>&lt;100ms latency</strong>.
                  Uses Silero VAD model for accurate real-time detection.
                </p>
                <div className="badge badge-info gap-1 mt-2">
                  🔵 Blue Indicator
                </div>
              </div>
            </div>

            {/* AI Thinking */}
            <div className="card bg-yellow-500/10 border-2 border-yellow-500/30">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-6 h-6 text-yellow-500" />
                  <h3 className="card-title text-lg">AI Thinking</h3>
                </div>
                <p className="text-sm">
                  Triggered when AI is processing your request, executing tools, or generating a response.
                  <strong>500ms</strong> delay prevents false positives.
                </p>
                <div className="badge badge-warning gap-1 mt-2">
                  🟡 Yellow Indicator
                </div>
              </div>
            </div>

            {/* AI Speaking */}
            <div className="card bg-purple-500/10 border-2 border-purple-500/30">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-6 h-6 text-purple-500" />
                  <h3 className="card-title text-lg">AI Speaking</h3>
                </div>
                <p className="text-sm">
                  Tracks audio playback from Gemini Live API. Detects when AI starts delivering audio responses and when playback completes.
                </p>
                <div className="badge badge-secondary gap-1 mt-2">
                  🟣 Purple Indicator
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Try It Out Section */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Try It Out!</h2>
          <p className="text-base-content/70 mb-4">
            Click the <strong>microphone button</strong> in the top-right navigation bar to start a voice session.
            The button will change colors to show the current state: <strong className="text-blue-500">Blue (pulsing)</strong> when you're speaking,
            <strong className="text-yellow-500"> Yellow</strong> when AI is thinking, and <strong className="text-purple-500">Purple (pulsing)</strong> when AI is responding.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Example Commands:</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <span className="badge badge-sm">🛍️</span>
                "Show me the products"
              </li>
              <li className="flex items-center gap-2">
                <span className="badge badge-sm">🔍</span>
                "Search for electronics"
              </li>
              <li className="flex items-center gap-2">
                <span className="badge badge-sm">🛒</span>
                "Add product 1 to my cart"
              </li>
              <li className="flex items-center gap-2">
                <span className="badge badge-sm">💰</span>
                "Find products under $100"
              </li>
              <li className="flex items-center gap-2">
                <span className="badge badge-sm">🏷️</span>
                "Browse accessories or storage"
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/products" className="card bg-base-200 hover:bg-base-300 transition-all">
          <div className="card-body">
            <h3 className="card-title">Products</h3>
            <p className="text-sm">Browse all available products</p>
            <div className="card-actions">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link to="/search" className="card bg-base-200 hover:bg-base-300 transition-all">
          <div className="card-body">
            <h3 className="card-title">Search</h3>
            <p className="text-sm">Search and filter products</p>
            <div className="card-actions">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link to="/cart" className="card bg-base-200 hover:bg-base-300 transition-all">
          <div className="card-body">
            <h3 className="card-title">Cart</h3>
            <p className="text-sm">View your shopping cart</p>
            <div className="card-actions">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Technical Details */}
      <div className="collapse collapse-arrow bg-base-200">
        <input type="checkbox" /> 
        <div className="collapse-title text-xl font-medium">
          🔧 Technical Details
        </div>
        <div className="collapse-content"> 
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Client-Side VAD (Voice Activity Detection)</h4>
              <ul className="list-disc list-inside space-y-1 text-base-content/70">
                <li>Uses Silero VAD model via <code className="badge badge-sm">@ricky0123/vad-web</code></li>
                <li>Model size: ~1-2MB (loaded once, cached by browser)</li>
                <li>Latency: &lt;100ms from speech to UI update</li>
                <li>Accuracy: &gt;95% in quiet environments, &gt;80% in noisy</li>
                <li>Browser support: Chrome 90+, Firefox 78+, Edge 90+</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Server-Side VAD (Gemini Live)</h4>
              <ul className="list-disc list-inside space-y-1 text-base-content/70">
                <li>Gemini's built-in VAD remains active for accuracy</li>
                <li>Latency: 200-500ms (higher but more accurate)</li>
                <li>Cross-referenced with client VAD for reliability</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">State Detection Logic</h4>
              <ul className="list-disc list-inside space-y-1 text-base-content/70">
                <li><strong>AI Thinking:</strong> Triggered on tool calls or 500ms after user stops speaking</li>
                <li><strong>AI Speaking:</strong> Tracked via audio playback and <code className="badge badge-sm">turnComplete</code> messages</li>
                <li><strong>Interruptions:</strong> Detected when user speaks while AI is speaking</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Performance</h4>
              <ul className="list-disc list-inside space-y-1 text-base-content/70">
                <li>Model loading: ~1-2 seconds (once per session)</li>
                <li>Runtime overhead: &lt;5ms per audio frame</li>
                <li>Memory usage: ~10-20MB additional</li>
                <li>Zero breaking changes - fully backward compatible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
