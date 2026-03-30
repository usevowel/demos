import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Platform, Modal } from 'react-native'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'expo-router'
import { useSnapshot } from 'valtio'
import { FaClipboardList, FaCheckCircle, FaSearch, FaCalendarAlt, FaHandPaper, FaStop } from 'react-icons/fa'
import QRCode from 'qrcode'
import NavBar from '../components/NavBar'
import { sharedState, addQRCode, removeQRCode, QRCodeData } from '../lib/store'
import mockData from '../assets/mock-data.json'
import UserMenu from '../components/UserMenu'
import { WarehouseWebSocket } from '../lib/websocket'
import { parsePairingQRCode, getPairingCodeFromURL } from '../lib/session-pairing'
import { useZxing } from 'react-zxing'

/**
 * Icon component that works with react-icons for web and provides fallback for native
 */
const Icon = ({ name, size = 20, color = '#18181b' }: { name: 'orders' | 'picked' | 'search' | 'calendar' | 'picking' | 'stop'; size?: number; color?: string }) => {
  if (Platform.OS === 'web') {
    if (name === 'orders') {
      return <FaClipboardList size={size} color={color} />
    } else if (name === 'picked') {
      return <FaCheckCircle size={size} color={color} />
    } else if (name === 'search') {
      return <FaSearch size={size} color={color} />
    } else if (name === 'calendar') {
      return <FaCalendarAlt size={size} color={color} />
    } else if (name === 'picking') {
      return <FaHandPaper size={size} color={color} />
    } else if (name === 'stop') {
      return <FaStop size={size} color={color} />
    }
  }
  
  // Fallback for native
  const iconMap: Record<string, string> = {
    orders: '📋',
    picked: '✅',
    search: '🔍',
    calendar: '📅',
    picking: '✋',
    stop: '⏹',
  }
  return <Text style={{ fontSize: size, color }}>{iconMap[name] || '📋'}</Text>
}

/**
 * Order status types for picker interface
 */
type OrderStatus = 'open' | 'assigned' | 'picking' | 'picked' | 'blocked'

/**
 * Block reason interface
 */
interface BlockReason {
  type: 'no_inventory' | 'damaged' | 'wrong_item' | 'other'
  description: string
  damagedCount?: number
}

/**
 * Order item interface
 */
interface OrderItem {
  itemId: string
  quantity: number        // Total quantity needed for this order
  pickedQuantity: number  // Cumulative quantity picked across all locations
  status: 'not_picked' | 'picking' | 'picked' | 'skipped' | 'blocked'
  location: string        // Primary/preferred location (e.g., "A3-R1-B1")
  notes?: string
  blockedReason?: BlockReason
}

/**
 * Order interface for picker page
 */
interface Order {
  id: string
  items: OrderItem[]
  pickerId?: string       // Assigned picker
  status: OrderStatus
  priority: 'low' | 'medium' | 'high'
  createdAt: string       // ISO date string
  startedAt?: string
  completedAt?: string
  notes?: string
}

/**
 * Item interface from mock data
 */
interface Item {
  id: string
  name: string
  description: string
  category: string
  locations: {
    location: string
    quantity: number
    maxQuantity: number
  }[]
}

/**
 * Pick Page (Picker Interface)
 * 
 * A mobile-optimized interface designed for warehouse workers on handheld devices.
 * Route: /pick
 * 
 * Features:
 * - Tabs for Available Orders and Picked Orders
 * - Filters (Date, Order Search, Order Status)
 * - Order cards showing order info with progress
 * - Click order to start picking (changes status to "picking")
 * - Click item to generate QR code on warehouse page (via shared state)
 */
export default function PickPage() {
  const router = useRouter()
  // Subscribe to shared state for QR codes
  const sharedSnapshot = useSnapshot(sharedState)
  
  // Track if component has mounted to prevent navigation before ready
  const [isMounted, setIsMounted] = useState(false)
  
  // Tab state: 'picking', 'available', or 'picked'
  const [activeTab, setActiveTab] = useState<'picking' | 'available' | 'picked'>('available')
  
  // Selected order state - when an order is selected, show its items
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  
  // User menu visibility
  const [userMenuVisible, setUserMenuVisible] = useState(false)
  
  // WebSocket and pairing state
  const [showPairingScanner, setShowPairingScanner] = useState(false)
  const [showPairingCodeInput, setShowPairingCodeInput] = useState(false)
  const [pairingCodeInput, setPairingCodeInput] = useState('')
  const [pairingError, setPairingError] = useState<string | null>(null)
  const [isRedeemingCode, setIsRedeemingCode] = useState(false)
  const pairingScannerRef = useRef<HTMLVideoElement | null>(null)
  const wsRef = useRef<WarehouseWebSocket | null>(null)
  
  // WebSocket server URLs - update these to match your deployed worker
  const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8787'
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('') // ISO date string
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  
  // Inline action state per item
  const [activeItemStates, setActiveItemStates] = useState<Map<string, {
    showPartial: boolean
    partialQuantity: number
    showBlock: boolean
    showBlockReason: boolean
    blockType: 'no_inventory' | 'damaged' | 'wrong_item' | 'other'
    blockReason: string
    damagedCount: string
  }>>(new Map())
  
  // Debounce timer for search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Mock orders data - will be replaced with actual data from backend later
  const [orders, setOrders] = useState<Order[]>([
    { 
      id: 'ORD-001', 
      status: 'assigned', 
      items: [
        { itemId: 'E-0001', quantity: 5, pickedQuantity: 0, status: 'not_picked', location: 'A1-R1-B1' },
        { itemId: 'E-0002', quantity: 3, pickedQuantity: 0, status: 'not_picked', location: 'A1-R1-B2' },
      ],
      priority: 'high', 
      createdAt: '2026-02-07T10:00:00Z' 
    },
    { 
      id: 'ORD-002', 
      status: 'assigned', 
      items: [
        { itemId: 'E-0003', quantity: 8, pickedQuantity: 0, status: 'not_picked', location: 'A1-R1-B3' },
        { itemId: 'E-0004', quantity: 2, pickedQuantity: 0, status: 'not_picked', location: 'A1-R2-B1' },
      ],
      priority: 'medium', 
      createdAt: '2026-02-07T10:15:00Z',
    },
    { 
      id: 'ORD-003', 
      status: 'picked', 
      items: [
        { itemId: 'E-0005', quantity: 4, pickedQuantity: 4, status: 'picked', location: 'A1-R2-B2' },
      ],
      pickerId: 'sarah-chen',
      priority: 'low', 
      createdAt: '2026-02-07T08:00:00Z',
      startedAt: '2026-02-07T08:05:00Z',
      completedAt: '2026-02-07T08:30:00Z'
    },
    { 
      id: 'ORD-004', 
      status: 'blocked', 
      items: [
        { itemId: 'E-0006', quantity: 6, pickedQuantity: 2, status: 'blocked', location: 'A1-R2-B3' },
      ],
      pickerId: 'marcus-johnson',
      priority: 'high', 
      createdAt: '2026-02-07T09:00:00Z',
      startedAt: '2026-02-07T09:05:00Z',
      notes: 'Item damaged at location'
    },
  ])
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Check for pairing data in URL and auto-connect
  useEffect(() => {
    if (!isMounted || !sharedSnapshot.currentUser) return
    
      // Check URL for pairing code
      const code = getPairingCodeFromURL()
      
      if (code && !sharedSnapshot.sessionId) {
        // Auto-connect using the code with configured URLs
        handlePairing(code, WS_URL, API_URL)
        // Clear the URL param after using it
        if (typeof window !== 'undefined') {
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
        }
      }
    }, [isMounted, sharedSnapshot.currentUser, sharedSnapshot.sessionId])

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isMounted) return
    
    if (!sharedSnapshot.currentUser) {
      router.replace('/')
    } else if (!sharedSnapshot.sessionId && !showPairingScanner) {
      setShowPairingScanner(true)
    }
  }, [sharedSnapshot.currentUser, sharedSnapshot.sessionId, router, isMounted, showPairingScanner])

  // Set up pairing QR scanner
  const { ref: zxingRef } = useZxing({
    onDecodeResult(result) {
      try {
        const qrDataString = result.getText()
        const pairingData = parsePairingQRCode(qrDataString)
        
        if (pairingData) {
          handlePairing(pairingData.sessionId, pairingData.wsUrl, pairingData.apiUrl)
        } else {
          setPairingError('Invalid pairing QR code')
        }
      } catch (error) {
        console.error('Failed to parse pairing QR code:', error)
        setPairingError('Failed to parse QR code')
      }
    },
    paused: !showPairingScanner,
  })

  /**
   * Handle pairing with warehouse session
   */
  const handlePairing = async (sessionId: string, wsUrl: string, apiUrl: string) => {
    try {
      setPairingError(null)
      
      const ws = new WarehouseWebSocket(wsUrl, 'picker')
      wsRef.current = ws

      ws.on('stateSync', (message) => {
        if (message.type === 'stateSync') {
          const state = message.state
          sharedState.activeQRCodes = new Map(Object.entries(state.activeQRCodes))
          sharedState.selectedOrderItem = state.selectedOrderItem
        }
      })

      ws.on('qrCodeAdded', (message) => {
        if (message.type === 'qrCodeAdded') {
          sharedState.activeQRCodes.set(message.location, message.qrCode)
        }
      })

      ws.on('qrCodeRemoved', (message) => {
        if (message.type === 'qrCodeRemoved') {
          sharedState.activeQRCodes.delete(message.location)
          if (sharedState.selectedOrderItem?.location === message.location) {
            sharedState.selectedOrderItem = null
          }
        }
      })

      ws.on('allQRCodesCleared', () => {
        sharedState.activeQRCodes = new Map()
        sharedState.selectedOrderItem = null
      })

      ws.on('selectedOrderItemChanged', (message) => {
        if (message.type === 'selectedOrderItemChanged') {
          sharedState.selectedOrderItem = message.orderItem
        }
      })

      ws.setOnConnect(() => {
        sharedState.wsConnected = true
        sharedState.sessionId = sessionId
        setShowPairingScanner(false)
        setPairingError(null)
      })

      ws.setOnDisconnect(() => {
        sharedState.wsConnected = false
      })

      ws.setOnError((error) => {
        console.error('[Pick] WebSocket error:', error)
        setPairingError('Connection error')
      })

      await ws.connect(sessionId)
    } catch (error) {
      console.error('[Pick] Failed to pair with session:', error)
      setPairingError(error instanceof Error ? error.message : 'Failed to connect')
    }
  }

  /**
   * Handle redeeming a pairing code
   */
  const handleRedeemCode = async () => {
    if (!pairingCodeInput.trim()) {
      setPairingError('Please enter a pairing code')
      return
    }

    try {
      setIsRedeemingCode(true)
      setPairingError(null)

      // Use the code directly as the session ID
      const code = pairingCodeInput.trim().toUpperCase()
      await handlePairing(code, WS_URL, API_URL)
      
      // Clear input and close modal
      setPairingCodeInput('')
      setShowPairingCodeInput(false)
    } catch (error) {
      console.error('[Pick] Failed to connect with code:', error)
      setPairingError(error instanceof Error ? error.message : 'Invalid pairing code')
    } finally {
      setIsRedeemingCode(false)
    }
  }

  // Initialize WebSocket connection when session ID is available
  useEffect(() => {
    if (!sharedSnapshot.sessionId || !isMounted) return

    let mounted = true

    async function connectToSession() {
      try {
        const ws = new WarehouseWebSocket(WS_URL, 'picker')
        wsRef.current = ws

        ws.on('stateSync', (message) => {
          if (message.type === 'stateSync') {
            const state = message.state
            sharedState.activeQRCodes = new Map(Object.entries(state.activeQRCodes))
            sharedState.selectedOrderItem = state.selectedOrderItem
          }
        })

        ws.on('qrCodeAdded', (message) => {
          if (message.type === 'qrCodeAdded') {
            sharedState.activeQRCodes.set(message.location, message.qrCode)
          }
        })

        ws.on('qrCodeRemoved', (message) => {
          if (message.type === 'qrCodeRemoved') {
            sharedState.activeQRCodes.delete(message.location)
            if (sharedState.selectedOrderItem?.location === message.location) {
              sharedState.selectedOrderItem = null
            }
          }
        })

        ws.on('allQRCodesCleared', () => {
          sharedState.activeQRCodes = new Map()
          sharedState.selectedOrderItem = null
        })

        ws.on('selectedOrderItemChanged', (message) => {
          if (message.type === 'selectedOrderItemChanged') {
            sharedState.selectedOrderItem = message.orderItem
          }
        })

        ws.setOnConnect(() => {
          sharedState.wsConnected = true
          if (mounted) {
            setShowPairingScanner(false)
            setPairingError(null)
          }
        })

        ws.setOnDisconnect(() => {
          sharedState.wsConnected = false
        })

        ws.setOnError((error) => {
          console.error('[Pick] WebSocket error:', error)
          if (mounted) {
            setPairingError('Connection error')
          }
        })

        if (sharedSnapshot.sessionId) {
          await ws.connect(sharedSnapshot.sessionId)
        }
      } catch (error) {
        console.error('[Pick] Failed to connect to session:', error)
      }
    }

    connectToSession()

    return () => {
      mounted = false
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [sharedSnapshot.sessionId, isMounted])

  // Load items from mock data
  const items = useMemo(() => mockData.skus || [] as Item[], [])

  // Get item details by ID
  const getItemById = (itemId: string): Item | undefined => {
    return items.find(item => item.id === itemId)
  }

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  // Check if current user has orders in process
  const userOrdersInProcess = useMemo(() => {
    if (!sharedSnapshot.currentUser) return []
    return orders.filter(order => 
      order.status === 'picking' && order.pickerId === sharedSnapshot.currentUser?.id
    )
  }, [orders, sharedSnapshot.currentUser])

  // Filter orders based on active tab and filters
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      if (activeTab === 'picking') {
        return order.status === 'picking' && order.pickerId === sharedSnapshot.currentUser?.id
      } else if (activeTab === 'available') {
        return order.status === 'open' || order.status === 'assigned'
      } else {
        return order.status === 'picked' || order.status === 'blocked'
      }
    })

    if (debouncedSearch) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === priorityFilter)
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString()
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt).toDateString()
        return orderDate === filterDate
      })
    }

    return filtered
  }, [orders, activeTab, debouncedSearch, priorityFilter, dateFilter, sharedSnapshot.currentUser])

  // Get selected order
  const selectedOrder = useMemo(() => {
    return orders.find(order => order.id === selectedOrderId) || null
  }, [orders, selectedOrderId])

  /**
   * Calculate order progress
   */
  const getOrderProgress = (order: Order): { picked: number; total: number; percentage: number } => {
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
    const pickedItems = order.items.reduce((sum, item) => sum + item.pickedQuantity, 0)
    return {
      picked: pickedItems,
      total: totalItems,
      percentage: totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get priority badge color
   */
  const getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#71717a'
    }
  }

  /**
   * Handle order selection
   */
  const handleSelectOrder = (orderId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId && (order.status === 'open' || order.status === 'assigned')
          ? { 
              ...order, 
              status: 'picking' as OrderStatus, 
              pickerId: sharedSnapshot.currentUser?.id,
              startedAt: order.startedAt || new Date().toISOString() 
            }
          : order
      )
    )
    
    setSelectedOrderId(orderId)
  }

  /**
   * Handle stop picking order
   */
  const handleStopPicking = (orderId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId
          ? { ...order, status: 'open' as OrderStatus, pickerId: undefined }
          : order
      )
    )
    
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null)
    }
  }

  /**
   * Handle skip item
   */
  const handleSkipItem = (orderId: string, itemId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId
          ? {
              ...order,
              items: order.items.map(item =>
                item.itemId === itemId
                  ? { ...item, status: 'skipped' as OrderItem['status'] }
                  : item
              )
            }
          : order
      )
    )
  }

  /**
   * Get or create item state
   */
  const getItemState = (itemKey: string, orderItem?: OrderItem) => {
    if (!activeItemStates.has(itemKey)) {
      let defaultQty = 1
      if (orderItem) {
        const maxQty = getMaxAvailableQuantity(orderItem)
        const remainingNeeded = orderItem.quantity - orderItem.pickedQuantity
        defaultQty = maxQty > 0 ? Math.min(maxQty, remainingNeeded) : (remainingNeeded > 0 ? remainingNeeded : 1)
      }
      
      activeItemStates.set(itemKey, {
        showPartial: false,
        partialQuantity: defaultQty,
        showBlock: false,
        showBlockReason: false,
        blockType: 'no_inventory',
        blockReason: '',
        damagedCount: '',
      })
    }
    return activeItemStates.get(itemKey)!
  }

  /**
   * Get available quantity at location for an order item
   */
  const getAvailableQuantityAtLocation = (orderItem: OrderItem): number => {
    const item = getItemById(orderItem.itemId)
    if (!item) return 0
    
    const locationData = item.locations.find(loc => loc.location === orderItem.location)
    if (!locationData) return 0
    
    return locationData.quantity
  }

  /**
   * Check if an item has zero inventory at its location
   */
  const hasZeroInventory = (orderItem: OrderItem): boolean => {
    return getAvailableQuantityAtLocation(orderItem) === 0
  }

  /**
   * Check if an order has any items with zero inventory
   */
  const orderHasZeroInventoryItems = (order: Order): boolean => {
    return order.items.some(item => hasZeroInventory(item))
  }

  /**
   * Get max available quantity for an order item at its location
   */
  const getMaxAvailableQuantity = (orderItem: OrderItem): number => {
    const availableAtLocation = getAvailableQuantityAtLocation(orderItem)
    const remainingNeeded = orderItem.quantity - orderItem.pickedQuantity
    return Math.min(availableAtLocation, remainingNeeded)
  }

  /**
   * Update item state
   */
  const updateItemState = (itemKey: string, updates: Partial<{
    showPartial: boolean
    partialQuantity: number
    showBlock: boolean
    showBlockReason: boolean
    blockType: 'no_inventory' | 'damaged' | 'wrong_item' | 'other'
    blockReason: string
    damagedCount: string
  }>) => {
    setActiveItemStates(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(itemKey) || {
        showPartial: false,
        partialQuantity: 0,
        showBlock: false,
        showBlockReason: false,
        blockType: 'no_inventory',
        blockReason: '',
        damagedCount: '',
      }
      newMap.set(itemKey, { ...current, ...updates })
      return newMap
    })
  }

  /**
   * Handle mark as picked
   */
  const handleMarkAsPicked = (orderId: string, itemId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id !== orderId) return order
        
        const updatedItems = order.items.map(item => {
          if (item.itemId !== itemId) return item
          
          const newPickedQuantity = Math.min(item.pickedQuantity + 1, item.quantity)
          const isFullyPicked = newPickedQuantity >= item.quantity
          
          return {
            ...item,
            pickedQuantity: newPickedQuantity,
            status: isFullyPicked ? 'picked' as OrderItem['status'] : 'picking' as OrderItem['status']
          }
        })
        
        const allPicked = updatedItems.every(item => item.status === 'picked')
        
        return {
          ...order,
          items: updatedItems,
          status: allPicked ? 'picked' as OrderStatus : order.status,
          completedAt: allPicked ? new Date().toISOString() : order.completedAt
        }
      })
    )
  }

  /**
   * Handle partial pick
   */
  const handlePartialPick = (orderId: string, itemId: string, quantity: number, blockReason?: BlockReason) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id !== orderId) return order
        
        const updatedItems = order.items.map(item => {
          if (item.itemId !== itemId) return item
          
          const newPickedQuantity = Math.min(item.pickedQuantity + quantity, item.quantity)
          const isFullyPicked = newPickedQuantity >= item.quantity
          
          return {
            ...item,
            pickedQuantity: newPickedQuantity,
            status: isFullyPicked ? 'picked' as OrderItem['status'] : 'picking' as OrderItem['status'],
            blockedReason: blockReason
          }
        })
        
        const allPicked = updatedItems.every(item => item.status === 'picked')
        
        return {
          ...order,
          items: updatedItems,
          status: allPicked ? 'picked' as OrderStatus : order.status,
          completedAt: allPicked ? new Date().toISOString() : order.completedAt
        }
      })
    )
    
    const itemKey = `${orderId}-${itemId}`
    updateItemState(itemKey, { 
      showPartial: false, 
      partialQuantity: 0,
      showBlock: false,
      showBlockReason: false,
      blockType: 'no_inventory',
      blockReason: '',
      damagedCount: ''
    })
  }

  /**
   * Handle confirm block item
   */
  const handleConfirmBlock = (orderId: string, itemId: string, location: string, blockType: 'no_inventory' | 'damaged' | 'wrong_item' | 'other', reason?: string, damagedCount?: string) => {
    const itemKey = `${orderId}-${itemId}`
    const state = getItemState(itemKey)
    
    const finalBlockType = blockType || state.blockType
    const finalReason = reason !== undefined ? reason : state.blockReason
    const finalDamagedCount = damagedCount !== undefined ? damagedCount : state.damagedCount
    
    if (finalBlockType === 'other' && !finalReason.trim()) {
      return
    }
    
    const blockReasonData: BlockReason = {
      type: finalBlockType,
      description: finalReason || (finalBlockType === 'damaged' ? `${finalDamagedCount || 0} damaged units` : finalBlockType),
      damagedCount: finalBlockType === 'damaged' && finalDamagedCount ? parseInt(finalDamagedCount, 10) : undefined
    }
    
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id !== orderId) return order
        
        const updatedItems = order.items.map(item =>
          item.itemId === itemId && item.location === location
            ? { ...item, status: 'blocked' as OrderItem['status'], blockedReason: blockReasonData }
            : item
        )
        
        const hasBlocked = updatedItems.some(item => item.status === 'blocked')
        
        return {
          ...order,
          items: updatedItems,
          status: hasBlocked ? 'blocked' as OrderStatus : order.status
        }
      })
    )
    
    updateItemState(itemKey, { 
      showBlock: false, 
      blockType: 'no_inventory', 
      blockReason: '', 
      damagedCount: '' 
    })
  }

  /**
   * Handle back from order items view
   */
  const handleBackToOrders = () => {
    setSelectedOrderId(null)
  }

  /**
   * Handle item selection - generates QR code on warehouse page
   */
  const handleSelectItem = async (orderId: string, itemId: string, location: string) => {
    const order = orders.find(o => o.id === orderId)
    const orderItem = order?.items.find(item => item.itemId === itemId && item.location === location)
    
    if (orderItem && hasZeroInventory(orderItem)) {
      return
    }
    
    const existingQR = Array.from(sharedSnapshot.activeQRCodes.entries()).find(
      ([loc]) => loc === location
    )
    
    if (existingQR) {
      removeQRCode(location)
      if (sharedState.selectedOrderItem?.location === location) {
        sharedState.selectedOrderItem = null
      }
      if (wsRef.current?.isConnected()) {
        wsRef.current.send({ type: 'removeQRCode', location })
        wsRef.current.send({ type: 'setSelectedOrderItem', orderItem: null })
      }
      return
    }

    const shelfId = location.split('-')[0]
    
    const qrData: QRCodeData = {
      location,
      itemId,
      orderId,
      timestamp: Date.now(),
    }

    try {
      const qrImageUri = await QRCode.toDataURL(JSON.stringify(qrData))
      const qrCodeEntry = { data: qrData, imageUri: qrImageUri, shelfId }
      
      addQRCode(location, qrCodeEntry)
      sharedState.selectedOrderItem = { orderId, itemId, location }
      
      if (wsRef.current?.isConnected()) {
        wsRef.current.send({ type: 'addQRCode', location, qrCode: qrCodeEntry })
        wsRef.current.send({ type: 'setSelectedOrderItem', orderItem: { orderId, itemId, location } })
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  return (
    <View style={styles.container}>
      <NavBar 
        title="Picker" 
        onUserClick={() => setUserMenuVisible(true)}
        actions={
          selectedOrder && selectedOrder.status === 'picking' && selectedOrder.pickerId === sharedSnapshot.currentUser?.id ? (
            <Pressable
              onPress={() => handleStopPicking(selectedOrder.id)}
              style={styles.stopButton}
            >
              <Icon name="stop" size={16} color="#ffffff" />
              <Text style={styles.stopButtonText}>Stop</Text>
            </Pressable>
          ) : undefined
        }
      />

      {selectedOrderId && selectedOrder ? (
        <View style={styles.container}>
          <View style={styles.backHeader}>
            <Pressable onPress={handleBackToOrders} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Orders</Text>
            </Pressable>
            <Text style={styles.orderTitle}>{selectedOrder.id}</Text>
          </View>
          
          <ScrollView style={styles.orderItemsContainer}>
            {selectedOrder.items.map((item) => {
              const itemDetails = getItemById(item.itemId)
              const itemKey = `${selectedOrder.id}-${item.itemId}`
              const itemState = getItemState(itemKey, item)
              const progress = getOrderProgress(selectedOrder)
              
              return (
                <View key={itemKey} style={styles.orderItemCard}>
                  <View style={styles.orderItemHeader}>
                    <Text style={styles.orderItemId}>{item.itemId}</Text>
                    <Text style={styles.orderItemStatus}>{item.status}</Text>
                  </View>
                  
                  {itemDetails && (
                    <Text style={styles.orderItemName}>{itemDetails.name}</Text>
                  )}
                  
                  <Text style={styles.orderItemLocation}>Location: {item.location}</Text>
                  
                  <View style={styles.orderItemProgress}>
                    <Text style={styles.orderItemProgressText}>
                      {item.pickedQuantity} / {item.quantity} picked
                    </Text>
                  </View>
                  
                  {item.status !== 'picked' && item.status !== 'blocked' && (
                    <View>
                      <View style={styles.orderItemActions}>
                        <Pressable
                          onPress={() => handleMarkAsPicked(selectedOrder.id, item.itemId)}
                          style={styles.pickButton}
                        >
                          <Text style={styles.pickButtonText}>Pick</Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={() => handleSkipItem(selectedOrder.id, item.itemId)}
                          style={styles.skipButton}
                        >
                          <Text style={styles.skipButtonText}>Skip</Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={() => {
                            const maxQty = getMaxAvailableQuantity(item)
                            updateItemState(itemKey, { 
                              showPartial: !itemState.showPartial, 
                              partialQuantity: maxQty > 0 ? maxQty : item.quantity - item.pickedQuantity,
                              showBlock: false 
                            })
                          }}
                          style={styles.partialButton}
                        >
                          <Text style={styles.partialButtonText}>Partial</Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={() => updateItemState(itemKey, { 
                            showBlock: !itemState.showBlock, 
                            showPartial: false 
                          })}
                          style={styles.blockButton}
                        >
                          <Text style={styles.blockButtonText}>Block</Text>
                        </Pressable>
                      </View>

                      {/* Partial quantity selection */}
                      {itemState.showPartial && (
                        <View style={styles.quantitySelectionContainer}>
                          <Text style={styles.quantityLabel}>Select Quantity:</Text>
                          <View style={styles.quantityButtons}>
                            {(() => {
                              const maxQty = getMaxAvailableQuantity(item)
                              const remainingNeeded = item.quantity - item.pickedQuantity
                              const actualMax = maxQty > 0 ? Math.min(maxQty, remainingNeeded) : remainingNeeded
                              return Array.from({ length: actualMax }, (_, i) => i + 1).map((qty) => (
                                <Pressable
                                  key={qty}
                                  onPress={() => {
                                    handlePartialPick(selectedOrder.id, item.itemId, qty)
                                  }}
                                  style={[
                                    styles.quantityButton,
                                    itemState.partialQuantity === qty && styles.quantityButtonActive
                                  ]}
                                >
                                  <Text style={[
                                    styles.quantityButtonText,
                                    itemState.partialQuantity === qty && styles.quantityButtonTextActive
                                  ]}>
                                    {qty}
                                  </Text>
                                </Pressable>
                              ))
                            })()}
                          </View>
                        </View>
                      )}

                      {/* Block type selection */}
                      {itemState.showBlock && (
                        <View style={styles.blockSelectionContainer}>
                          <Text style={styles.blockLabel}>Select Block Type:</Text>
                          <View style={styles.blockTypeButtons}>
                            {(['no_inventory', 'damaged', 'wrong_item', 'other'] as const).map((type) => (
                              <Pressable
                                key={type}
                                onPress={() => {
                                  if (type === 'other') {
                                    // Show reason input for "other"
                                    updateItemState(itemKey, { 
                                      blockType: type, 
                                      showBlockReason: true 
                                    })
                                  } else {
                                    // Confirm block immediately for other types
                                    handleConfirmBlock(selectedOrder.id, item.itemId, item.location, type)
                                  }
                                }}
                                style={[
                                  styles.blockTypeButton,
                                  itemState.blockType === type && styles.blockTypeButtonActive
                                ]}
                              >
                                <Text style={[
                                  styles.blockTypeButtonText,
                                  itemState.blockType === type && styles.blockTypeButtonTextActive
                                ]}>
                                  {type === 'no_inventory' ? 'No Inventory' :
                                   type === 'damaged' ? 'Damaged' :
                                   type === 'wrong_item' ? 'Wrong Item' :
                                   'Other'}
                                </Text>
                              </Pressable>
                            ))}
                          </View>

                          {/* Reason input for "other" type */}
                          {itemState.showBlockReason && itemState.blockType === 'other' && (
                            <View style={styles.reasonInputContainer}>
                              <Text style={styles.reasonLabel}>Reason:</Text>
                              <TextInput
                                style={styles.reasonInput}
                                placeholder="Enter reason..."
                                value={itemState.blockReason}
                                onChangeText={(text) => updateItemState(itemKey, { blockReason: text })}
                                multiline
                                numberOfLines={2}
                              />
                              <Pressable
                                onPress={() => {
                                  if (itemState.blockReason.trim()) {
                                    handleConfirmBlock(selectedOrder.id, item.itemId, item.location, 'other', itemState.blockReason)
                                  }
                                }}
                                style={[
                                  styles.confirmReasonButton,
                                  !itemState.blockReason.trim() && styles.confirmReasonButtonDisabled
                                ]}
                                disabled={!itemState.blockReason.trim()}
                              >
                                <Text style={styles.confirmReasonButtonText}>Confirm</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('available')}
              style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
                Available
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('picking')}
              style={[styles.tab, activeTab === 'picking' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'picking' && styles.activeTabText]}>
                Picking
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('picked')}
              style={[styles.tab, activeTab === 'picked' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'picked' && styles.activeTabText]}>
                Picked
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.filterContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView style={styles.ordersList}>
            {filteredOrders.map((order) => {
              const progress = getOrderProgress(order)
              
              return (
                <Pressable
                  key={order.id}
                  onPress={() => handleSelectOrder(order.id)}
                  style={styles.orderCard}
                >
                  <View style={styles.orderCardHeader}>
                    <Text style={styles.orderCardId}>{order.id}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(order.priority) }]}>
                      <Text style={styles.priorityBadgeText}>{order.priority}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderCardBody}>
                    <Text style={styles.orderCardItems}>{order.items.length} items</Text>
                    <Text style={styles.orderCardDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
                  </View>
                  
                  <Text style={styles.progressText}>
                    {progress.picked} / {progress.total} picked ({progress.percentage}%)
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      )}
      
      <UserMenu visible={userMenuVisible} onClose={() => setUserMenuVisible(false)} />
      
      <Modal
        visible={showPairingScanner}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan Pairing Code</Text>
            <Text style={styles.modalSubtitle}>
              Scan the QR code from the warehouse to connect
            </Text>
            {pairingError && (
              <Text style={styles.errorText}>{pairingError}</Text>
            )}
            <video
              ref={pairingScannerRef}
              style={styles.scannerVideo}
            />
            
            {/* Divider with "OR" text */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            {/* Button to enter pairing code manually */}
            <Pressable
              onPress={() => {
                setShowPairingScanner(false)
                setShowPairingCodeInput(true)
                setPairingError(null)
              }}
              style={styles.enterCodeButton}
            >
              <Text style={styles.enterCodeButtonText}>Enter Pairing Code</Text>
            </Pressable>
            
            <Pressable
              onPress={() => setShowPairingScanner(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Pairing Code Input Modal */}
      <Modal
        visible={showPairingCodeInput}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Pairing Code</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-character code from the warehouse
            </Text>
            
            {pairingError && (
              <Text style={styles.errorText}>{pairingError}</Text>
            )}
            
            <TextInput
              style={styles.pairingCodeInput}
              placeholder="ABC123"
              value={pairingCodeInput}
              onChangeText={(text) => setPairingCodeInput(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              editable={!isRedeemingCode}
            />
            
            <Pressable
              onPress={handleRedeemCode}
              disabled={isRedeemingCode || pairingCodeInput.length < 6}
              style={[
                styles.connectButton,
                (isRedeemingCode || pairingCodeInput.length < 6) && styles.connectButtonDisabled
              ]}
            >
              <Text style={styles.connectButtonText}>
                {isRedeemingCode ? 'Connecting...' : 'Connect'}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                setShowPairingCodeInput(false)
                setPairingCodeInput('')
                setPairingError(null)
              }}
              style={styles.cancelButton}
              disabled={isRedeemingCode}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#18181b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717a',
  },
  activeTabText: {
    color: '#18181b',
    fontWeight: '600',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCardId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  orderCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderCardItems: {
    fontSize: 14,
    color: '#71717a',
  },
  orderCardDate: {
    fontSize: 14,
    color: '#71717a',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e4e4e7',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#71717a',
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: '#3b82f6',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
  },
  orderItemsContainer: {
    flex: 1,
    padding: 16,
  },
  orderItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
  },
  orderItemStatus: {
    fontSize: 12,
    color: '#71717a',
    textTransform: 'capitalize',
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181b',
    marginBottom: 4,
  },
  orderItemLocation: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 8,
  },
  orderItemProgress: {
    marginBottom: 12,
  },
  orderItemProgressText: {
    fontSize: 14,
    color: '#18181b',
  },
  orderItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717a',
  },
  partialButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  partialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  blockButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  quantitySelectionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
  },
  quantityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quantityButton: {
    minWidth: 50,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  quantityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  quantityButtonTextActive: {
    color: '#ffffff',
  },
  blockSelectionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
  },
  blockLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
  },
  blockTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  blockTypeButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTypeButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  blockTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  blockTypeButtonTextActive: {
    color: '#ffffff',
  },
  reasonInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#18181b',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  confirmReasonButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmReasonButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.5,
  },
  confirmReasonButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 16,
  },
  scannerVideo: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717a',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e4e4e7',
  },
  dividerText: {
    fontSize: 14,
    color: '#71717a',
    marginHorizontal: 12,
  },
  enterCodeButton: {
    backgroundColor: '#18181b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  enterCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  pairingCodeInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
  },
  connectButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})
