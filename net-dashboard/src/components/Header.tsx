/**
 * Header component with vowel | net branding, global search, and voice assistant button
 */

import { Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useSnapshot } from 'valtio'
import { UserMenu } from './UserMenu'
import { Search, X, Server, Building2, Mic } from 'lucide-react'
import { getAllDevices } from '@/data/devices'
import { getAllTenants } from '@/data/tenants'
import { setSelectedTenant } from '@/store/tenantStore'
import { useVowel } from '@vowel.to/client/react'
import { uiStore } from '@/store/uiStore'


export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { state, toggleSession } = useVowel()
  const isAgentActive = state?.isConnected ?? false
  const uiSnap = useSnapshot(uiStore)
  const isLightMode = uiSnap.theme === 'light'

  const devices = getAllDevices()
  const tenants = getAllTenants()

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    const matchedDevices = devices
      .filter(d => 
        d.hostname.toLowerCase().includes(query) ||
        d.deviceId.toLowerCase().includes(query) ||
        d.ipAddress.includes(query) ||
        d.model.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(d => ({ type: 'device' as const, item: d }))
    
    const matchedTenants = tenants
      .filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .map(t => ({ type: 'tenant' as const, item: t }))
    
    return [...matchedDevices, ...matchedTenants]
  }, [searchQuery, devices, tenants])

  const handleSelect = (result: typeof searchResults[0]) => {
    setSearchOpen(false)
    setSearchQuery('')
    if (result.type === 'device') {
      navigate({ to: '/devices/$deviceId', params: { deviceId: result.item.id } })
    } else {
      setSelectedTenant(result.item.id)
      navigate({ to: '/tenants' })
    }
  }

  const handleVoiceClick = () => {
    toggleSession()
  }

  return (
    <>
      <header className="bg-bg-secondary border-b border-border h-16 flex items-center px-6 z-50">
        <div className="flex items-center gap-2">
          {/* vowel | net branding */}
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <a
              href="https://vowel.to"
              target="_blank"
              rel="noopener noreferrer"
              className="font-ocr-a text-3xl hover:text-cisco-blue transition-colors"
            >
              vowel
            </a>
            <span className="text-text-secondary">|</span>
            <Link
              to="/"
              className="hover:text-cisco-blue transition-colors"
            >
              net
            </Link>
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* Voice Assistant Button */}
          <div className="relative">
            <button
              onClick={handleVoiceClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                isAgentActive
                  ? isLightMode
                    ? 'bg-cisco-blue text-white animate-pulse'
                    : 'bg-white text-gray-900 animate-pulse'
                  : isLightMode
                    ? 'bg-cisco-blue text-white hover:bg-cisco-blue-light animate-glow-blue'
                    : 'bg-white text-gray-900 hover:bg-gray-100 animate-glow-white'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isAgentActive ? (
                  'Listening...'
                ) : (
                  <>
                    <span className="font-light">Try</span> <span className="font-bold">NetVoice</span> <span className="font-light">| powered by</span> <span className="font-ocr-a">vowel</span>
                  </>
                )}
              </span>
              {!isAgentActive && (
                <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isLightMode
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-yellow-500 text-gray-900'
                }`}>
                  NEW
                </span>
              )}
            </button>
          </div>

          {/* Global Search */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary hover:bg-bg-primary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search...</span>
              <span className="hidden md:inline text-xs text-text-secondary ml-2 px-1.5 py-0.5 bg-bg-secondary rounded">
                ⌘K
              </span>
            </button>
          </div>

          {/* User menu with avatar */}
          <UserMenu />
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="h-5 w-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search devices, tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary outline-none"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 hover:bg-bg-tertiary rounded"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.item.id}-${idx}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors text-left"
                    >
                      {result.type === 'device' ? (
                        <>
                          <div className="p-2 bg-cisco-blue/10 rounded-lg">
                            <Server className="h-4 w-4 text-cisco-blue" />
                          </div>
                          <div className="flex-1">
                            <p className="text-text-primary font-medium">
                              <span className="font-mono text-cisco-blue">{result.item.deviceId}</span>
                            </p>
                            <p className="text-sm text-text-secondary">
                              <Link
                                to="/topology"
                                className="font-semibold text-text-primary hover:text-cisco-blue hover:underline"
                                onClick={(e) => { e.stopPropagation(); setSearchOpen(false) }}
                              >
                                {result.item.hostname}
                              </Link>
                              {' · '}{result.item.model} · {result.item.ipAddress}
                            </p>
                          </div>
                          <span className="text-xs text-text-secondary px-2 py-1 bg-bg-tertiary rounded">
                            Device
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Building2 className="h-4 w-4 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-text-primary font-medium">{result.item.name}</p>
                            <p className="text-sm text-text-secondary line-clamp-1">
                              {result.item.description}
                            </p>
                          </div>
                          <span className="text-xs text-text-secondary px-2 py-1 bg-bg-tertiary rounded">
                            Tenant
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-8 text-center text-text-secondary">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div className="p-8 text-center text-text-secondary">
                  Type to search devices and tenants...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
