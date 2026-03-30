import { View, Text, Pressable, StyleSheet, Image, Modal, ScrollView, TextInput, Platform } from 'react-native'
import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react'
import { useRouter } from 'expo-router'
import { useSnapshot } from 'valtio'
import QRCode from 'qrcode'
import { FaBox, FaClipboardList, FaUserCircle } from 'react-icons/fa'
import mockData from '../assets/mock-data.json'
import { 
  sharedState, 
  removeQRCode, 
  warehouseStore, 
  loadWarehouseItems, 
  setWarehouseSearchQueryDebounced,
  clearWarehouseSearch,
  clearWarehouseSearchDebounce 
} from '../lib/store'
import UserMenu from '../components/UserMenu'
import { WarehouseWebSocket, createWarehouseSession } from '../lib/websocket'
import { generatePairingQRCode, generatePairingURL } from '../lib/session-pairing'

/**
 * Icon component that works with react-icons for web and provides fallback for native
 * For native platforms, we'll use text-based icons
 */
const Icon = ({ name, size = 20, color = '#18181b' }: { name: 'inventory' | 'inventory2' | 'orders' | 'user'; size?: number; color?: string }) => {
  if (Platform.OS === 'web') {
    // Use react-icons for web - react-icons components work with react-native-web
    if (name === 'inventory' || name === 'inventory2') {
      return <FaBox size={size} color={color} />
    } else if (name === 'orders') {
      return <FaClipboardList size={size} color={color} />
    } else if (name === 'user') {
      return <FaUserCircle size={size} color={color} />
    }
  }
  
  // Fallback for native - use text icons
  const iconMap: Record<string, string> = {
    inventory: '📦',
    inventory2: '📦',
    orders: '📋',
    user: '👤',
  }
  return <Text style={{ fontSize: size, color }}>{iconMap[name] || '📦'}</Text>
}

/**
 * Warehouse shelf configuration:
 * - 25 shelves arranged in a 5x5 grid (A1-E5)
 * - Each shelf has 6 rows × 3 items wide = 18 item locations per shelf
 * - Total: 25 shelves × 18 items = 450 total item locations
 * - Location format: {SHELF}-R{ROW}-B{BIN} (e.g., "A1-R1-B1", "A1-R1-B2", "A1-R1-B3")
 */
const SHELF_POSITIONS: { id: string; row: number; col: number }[] = []
const rows = ["A", "B", "C", "D", "E"]
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    SHELF_POSITIONS.push({
      id: `${rows[r]}${c + 1}`,
      row: r,
      col: c,
    })
  }
}

// Helper to get items for a specific shelf
const getItemsForShelf = (shelfId: string, items: Item[]) => {
  return items.filter(item => 
    item.locations.some(loc => loc.location.startsWith(shelfId))
  )
}

interface QRCodeData {
  location: string        // Shelf location (e.g., "A3-R1-B1")
  itemId: string          // Product ID
  orderId?: string       // Associated order (if active)
  timestamp: number      // When generated
}

interface Item {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: string
  readonly locations: readonly {
    readonly location: string
    readonly quantity: number
    readonly maxQuantity: number
  }[]
}

type OrderStatus = 'awaiting' | 'picking' | 'picked'

interface OrderItem {
  itemId: string
  quantity: number        // Total quantity needed for this order
  pickedQuantity: number  // Cumulative quantity picked across all locations
  location: string        // Primary/preferred location (e.g., "A3-R1-B1")
}

interface Order {
  id: string
  status: OrderStatus
  items: OrderItem[]
  itemCount: number
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

/**
 * Search input component - isolated to prevent warehouse page re-renders on typing
 * Uses local state for immediate input updates, debounces store updates
 */
interface SearchInputProps {
  onSearch: (text: string) => void
  externalSearchQuery: string // Only pass the value, not the whole snapshot
}

const SearchInput = memo(function SearchInput({ onSearch, externalSearchQuery }: SearchInputProps) {
  const [localValue, setLocalValue] = useState('')
  const lastSyncedQueryRef = useRef<string>('')
  
  // Sync with store when external clear happens (only when cleared externally)
  useEffect(() => {
    // Only sync if the store was cleared externally (empty) and we have local value
    // Don't sync on every debounced update to avoid interfering with typing
    if (externalSearchQuery === '' && localValue !== '' && lastSyncedQueryRef.current !== '') {
      setLocalValue('')
      lastSyncedQueryRef.current = ''
    }
  }, [externalSearchQuery, localValue])
  
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search items..."
        value={localValue}
        onChangeText={(text) => {
          // Update local state immediately for responsive typing
          setLocalValue(text)
          lastSyncedQueryRef.current = text
          // Trigger debounced search update
          onSearch(text)
        }}
        editable={true}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {localValue.trim().length > 0 && (
        <Pressable
          onPress={() => {
            setLocalValue('')
            lastSyncedQueryRef.current = ''
            clearWarehouseSearch()
            clearWarehouseSearchDebounce()
          }}
          style={styles.resetButton}
        >
          <Text style={styles.resetButtonText}>×</Text>
        </Pressable>
      )}
    </View>
  )
})

export default function WarehousePage() {
  const router = useRouter()
  // Subscribe to shared state for QR codes (synced with pick page)
  // QR codes are only generated when a pick user selects an item on an order they're picking
  const sharedSnapshot = useSnapshot(sharedState)
  
  // Track if component has mounted to prevent navigation before ready
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Redirect to home if not logged in or not admin
  useEffect(() => {
    if (!isMounted) return
    
    if (!sharedSnapshot.currentUser) {
      router.replace('/')
    } else if (sharedSnapshot.currentUser.role !== 'admin') {
      // Non-admin users should be redirected to pick page
      router.replace('/pick')
    }
  }, [sharedSnapshot.currentUser, router, isMounted])
  
  // Subscribe to warehouse store for search/filter state
  const warehouseSnapshot = useSnapshot(warehouseStore)
  
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null) // Selected location for modal
  const [modalVisible, setModalVisible] = useState(false)
  const [userMenuVisible, setUserMenuVisible] = useState(false) // User menu visibility
  const [items, setItems] = useState<Item[]>([])
  const [showInventory, setShowInventory] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [ordersTab, setOrdersTab] = useState<OrderStatus>('awaiting')
  const [shelfInfoVersion, setShelfInfoVersion] = useState(0) // Track when to recalculate shelf info
  
  // WebSocket and pairing state
  const [pairingQRCodeUri, setPairingQRCodeUri] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [showPairingModal, setShowPairingModal] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const wsRef = useRef<WarehouseWebSocket | null>(null)
  
  // WebSocket server URLs - update these to match your deployed worker
  // For local development, use ws://localhost:8787 or your local dev server
  const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8787'
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'
  
  // Mock orders data - will be replaced with actual data later
  const orders: Order[] = useMemo(() => [
    { 
      id: 'ORD-001', 
      status: 'awaiting', 
      items: [
        { itemId: 'E-0001', quantity: 5, pickedQuantity: 0, location: 'A1-R1-B1' },
        { itemId: 'E-0002', quantity: 3, pickedQuantity: 0, location: 'A1-R1-B2' },
      ],
      itemCount: 5, 
      priority: 'high', 
      createdAt: '2026-02-07T10:00:00Z' 
    },
    { 
      id: 'ORD-002', 
      status: 'awaiting', 
      items: [
        { itemId: 'E-0003', quantity: 2, pickedQuantity: 0, location: 'A1-R1-B3' },
      ],
      itemCount: 3, 
      priority: 'medium', 
      createdAt: '2026-02-07T10:15:00Z' 
    },
    { 
      id: 'ORD-003', 
      status: 'picking', 
      items: [
        { itemId: 'E-0004', quantity: 8, pickedQuantity: 3, location: 'A1-R2-B1' },
      ],
      itemCount: 8, 
      priority: 'high', 
      createdAt: '2026-02-07T09:30:00Z' 
    },
    { 
      id: 'ORD-004', 
      status: 'picked', 
      items: [
        { itemId: 'E-0005', quantity: 4, pickedQuantity: 4, location: 'A1-R2-B2' },
      ],
      itemCount: 4, 
      priority: 'low', 
      createdAt: '2026-02-07T08:00:00Z' 
    },
  ], [])
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => order.status === ordersTab)
  }, [orders, ordersTab])

  // Initialize WebSocket connection and create session when admin user loads page
  useEffect(() => {
    if (!isMounted || !sharedSnapshot.currentUser || sharedSnapshot.currentUser.role !== 'admin') {
      return
    }

    let mounted = true

    async function initializeSession() {
      try {
        // Create a new warehouse session
        const { sessionId } = await createWarehouseSession(API_URL)
        
        if (!mounted) return

        sharedState.sessionId = sessionId

        // Generate pairing QR code and pairing URL
        const qrUri = await generatePairingQRCode(sessionId, WS_URL, API_URL)
        
        // Generate pairing URL (for desktop testing - copy/paste link)
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const pairingLink = generatePairingURL(sessionId, baseUrl)
        
        if (mounted) {
          setPairingQRCodeUri(qrUri)
          setPairingCode(pairingLink)
          setShowPairingModal(true)
        }

        // Connect WebSocket
        const ws = new WarehouseWebSocket(WS_URL, 'warehouse')
        wsRef.current = ws

        // Set up message handlers
        ws.on('stateSync', (message) => {
          if (message.type === 'stateSync') {
            // Sync state from server
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
        })

        ws.setOnDisconnect(() => {
          sharedState.wsConnected = false
        })

        ws.setOnError((error) => {
          console.error('[Warehouse] WebSocket error:', error)
        })

        // Connect to session
        await ws.connect(sessionId)
      } catch (error) {
        console.error('[Warehouse] Failed to initialize session:', error)
      }
    }

    initializeSession()

    return () => {
      mounted = false
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [isMounted, sharedSnapshot.currentUser])

  // Sync local state changes to WebSocket
  useEffect(() => {
    if (!wsRef.current?.isConnected()) return

    // Subscribe to QR code changes
    const unsubscribe = () => {
      // Valtio subscription cleanup handled automatically
    }

    return unsubscribe
  }, [])

  // Load mock data and calculate shelf info once at startup
  useEffect(() => {
    const skuItems = mockData.skus || []
    setItems(skuItems)
    loadWarehouseItems(skuItems)
    // Trigger shelf info calculation on initial load
    setShelfInfoVersion(prev => prev + 1)
  }, [])

  // Listen for reset demo - when QR codes are cleared, recalculate shelf info
  const prevQRCodesSizeRef = useRef(sharedSnapshot.activeQRCodes.size)
  useEffect(() => {
    const currentSize = sharedSnapshot.activeQRCodes.size
    // If QR codes went from >0 to 0, reset was likely pressed
    if (prevQRCodesSizeRef.current > 0 && currentSize === 0) {
      setShelfInfoVersion(prev => prev + 1)
    }
    prevQRCodesSizeRef.current = currentSize
  }, [sharedSnapshot.activeQRCodes.size])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      clearWarehouseSearchDebounce()
    }
  }, [])

  // Handle search input changes - debounces store update to prevent excessive filtering
  const handleSearchInputChange = useCallback((text: string) => {
    setWarehouseSearchQueryDebounced(text, 300)
  }, [])

  /**
   * Handle shelf click - remove QR code if it exists
   * QR codes are now generated from pick page via shared state
   */
  const handleShelfClick = (shelfId: string) => {
    // Find QR codes for this shelf and remove them
    const qrCodesToRemove: string[] = []
    sharedSnapshot.activeQRCodes.forEach((value, location) => {
      if (value.shelfId === shelfId) {
        qrCodesToRemove.push(location)
      }
    })
    
    // Remove all QR codes for this shelf
    qrCodesToRemove.forEach(location => {
      removeQRCode(location)
      // Sync to WebSocket
      if (wsRef.current?.isConnected()) {
        wsRef.current.send({ type: 'removeQRCode', location })
      }
    })
  }

  // Pre-compute shelf item counts only once at startup or when reset is pressed
  // NOTE: Uses full 'items' list, NOT 'filteredItems' - filtering inventory should not affect shelf displays
  // Only recalculates when shelfInfoVersion changes (on mount or after reset)
  // Items is included in deps but only set once on mount, so no extra recalculations
  const shelfItemCounts = useMemo(() => {
    const counts = new Map<string, number>()
    SHELF_POSITIONS.forEach(shelf => {
      counts.set(shelf.id, getItemsForShelf(shelf.id, items).length)
    })
    return counts
  }, [items, shelfInfoVersion]) // Recalculate when items load or when reset triggers shelfInfoVersion change

  // Use filtered items from warehouse store (computed in store, not here)
  const filteredItems = warehouseSnapshot.filteredItems

  // Calculate total quantity for each item (memoized per item)
  const getTotalQuantity = (item: Item) => {
    return item.locations.reduce((sum, loc) => sum + loc.quantity, 0)
  }

  // Get item count for a shelf (now uses pre-computed map)
  const getShelfItemCount = (shelfId: string) => {
    return shelfItemCounts.get(shelfId) || 0
  }

  /**
   * Memoize all QR codes grouped by shelf to avoid expensive recalculations on every render
   * Only recalculates when QR codes actually change
   * Accessing .size ensures Valtio tracks changes to the Map
   */
  const qrCodesByShelf = useMemo(() => {
    // Access Map.size first to ensure Valtio tracks the Map reference
    const mapSize = sharedSnapshot.activeQRCodes.size
    const qrCodesMap = new Map<string, Array<{ location: string; data: QRCodeData; imageUri: string }>>()
    
    // Initialize all shelves with empty arrays
    SHELF_POSITIONS.forEach(shelf => {
      qrCodesMap.set(shelf.id, [])
    })
    
    // Convert to array once and distribute to shelves
    // Accessing entries() ensures Valtio tracks all Map entries
    const entries = Array.from(sharedSnapshot.activeQRCodes.entries())
    entries.forEach(([location, value]) => {
      const shelfId = value.shelfId
      const existing = qrCodesMap.get(shelfId) || []
      qrCodesMap.set(shelfId, [...existing, { location, ...value }])
    })
    
    return qrCodesMap
    // Use size as dependency - Valtio will trigger re-render when Map changes
  }, [sharedSnapshot.activeQRCodes.size])

  /**
   * Get QR codes for a specific shelf (now uses memoized map)
   * Accesses Map directly to ensure Valtio reactivity
   */
  const getQRCodesForShelf = (shelfId: string) => {
    return qrCodesByShelf.get(shelfId) || []
  }

  /**
   * Extract shelf ID from location string (e.g., "A1-R1-B1" -> "A1")
   */
  const getShelfIdFromLocation = (location: string): string => {
    return location.split('-')[0]
  }

  /**
   * Parse location string and calculate position for QR overlay
   * Location format: {SHELF}-R{ROW}-B{BIN} (e.g., "A1-R1-B1")
   * Returns position object with top and left values in pixels
   */
  const getQRPosition = (location: string): { top: number; left: number; size: number } => {
    const parts = location.split('-')
    if (parts.length !== 3) {
      // Fallback to default position if format is unexpected
      return { top: 5, left: 5, size: 20 }
    }
    
    // Extract row and bin numbers (e.g., "R1" -> 1, "B2" -> 2)
    const rowMatch = parts[1]?.match(/R(\d+)/)
    const binMatch = parts[2]?.match(/B(\d+)/)
    
    if (!rowMatch || !binMatch) {
      return { top: 5, left: 5, size: 20 }
    }
    
    const row = parseInt(rowMatch[1], 10)
    const bin = parseInt(binMatch[1], 10)
    
    // Shelf is 70x70 pixels, with 6 rows × 3 bins
    const shelfSize = 70
    const rows = 6
    const binsPerRow = 3
    
    // Calculate cell size
    const cellHeight = shelfSize / rows  // ~11.67px
    const cellWidth = shelfSize / binsPerRow  // ~23.33px
    
    // QR code size should fit within the smaller dimension (cellHeight)
    // Use 80% of cell height to leave some padding
    const qrSize = Math.min(cellHeight * 0.8, cellWidth * 0.8)
    
    // Calculate position (centering QR code in cell)
    const top = (row - 1) * cellHeight + (cellHeight - qrSize) / 2
    const left = (bin - 1) * cellWidth + (cellWidth - qrSize) / 2
    
    return { top: Math.max(0, top), left: Math.max(0, left), size: Math.round(qrSize) }
  }

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <View style={styles.navHeaderLeft}>
          <Text style={styles.logo}>vowel | pickr</Text>
          <Text style={styles.navHeaderTitle}>Warehouse</Text>
        </View>
        <View style={styles.navHeaderRight}>
          <View style={styles.navHeaderActions}>
            <Pressable
              onPress={() => setShowInventory(!showInventory)}
              style={({ pressed }) => [
                styles.iconButton,
                showInventory && styles.iconButtonActive,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Icon 
                name={showInventory ? 'inventory' : 'inventory2'} 
                size={20} 
                color={showInventory ? '#ffffff' : '#18181b'} 
              />
              {showInventory && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{filteredItems.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => setShowOrders(!showOrders)}
              style={({ pressed }) => [
                styles.iconButton,
                showOrders && styles.iconButtonActive,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Icon name="orders" size={20} color={showOrders ? '#ffffff' : '#18181b'} />
              {orders.filter(o => o.status === 'awaiting' || o.status === 'picking').length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {orders.filter(o => o.status === 'awaiting' || o.status === 'picking').length}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
          <Pressable 
            style={styles.userAvatarButton}
            onPress={() => setUserMenuVisible(true)}
          >
            <Icon name="user" size={24} color="#18181b" />
            {sharedSnapshot.currentUser?.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>A</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>

        <View style={styles.mainContent}>
          {/* Shelf Grid */}
          <View style={[
            styles.gridContainer, 
            (showInventory || showOrders) && styles.gridContainerShrink
          ]}>
            <Text style={styles.title}>Warehouse Shelves</Text>
            
            <View style={styles.grid}>
              {SHELF_POSITIONS.map((shelf) => {
                const itemCount = getShelfItemCount(shelf.id)
                const shelfQRCodes = getQRCodesForShelf(shelf.id)
                const hasQRCode = shelfQRCodes.length > 0
                
                return (
                  <View key={shelf.id} style={styles.shelfContainer}>
                    <View style={styles.shelf}>
                      <Text style={styles.shelfText}>
                        {shelf.id}
                      </Text>
                      {itemCount > 0 && (
                        <View style={styles.itemCountBadge}>
                          <Text style={styles.itemCountText}>{itemCount}</Text>
                        </View>
                      )}
                      {hasQRCode && (
                        <View style={styles.qrIndicator}>
                          <Text style={styles.qrIndicatorText}>QR</Text>
                        </View>
                      )}
                    </View>
                    {/* QR Code Overlays positioned at shelf locations */}
                    {shelfQRCodes.map((qr) => {
                      const position = getQRPosition(qr.location)
                      return (
                        <Pressable
                          key={qr.location}
                          onPress={() => {
                            setSelectedQRCode(qr.location)
                            setModalVisible(true)
                          }}
                          style={[
                            styles.qrOverlay,
                            { 
                              top: position.top, 
                              left: position.left,
                              width: position.size,
                              height: position.size,
                            }
                          ]}
                        >
                          <Image
                            source={{ uri: qr.imageUri }}
                            style={styles.qrOverlayImage}
                          />
                        </Pressable>
                      )
                    })}
                  </View>
                )
              })}
            </View>
          </View>

          {/* Inventory Panel */}
          {showInventory && (
            <View style={styles.inventoryPanel}>
              <Text style={styles.inventoryTitle}>Inventory</Text>
              
              <SearchInput onSearch={handleSearchInputChange} warehouseSnapshot={warehouseSnapshot} />

              <ScrollView style={styles.inventoryList}>
                {filteredItems.map((item) => (
                  <View key={item.id} style={styles.skuItem}>
                    <View style={styles.skuHeader}>
                      <Text style={styles.skuId}>{item.id}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]} >
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.skuName}>{item.name}</Text>
                    <Text style={styles.skuDescription}>{item.description}</Text>
                    
                    <View style={styles.skuFooter}>
                      <Text style={styles.skuQuantity}>
                        Qty: {getTotalQuantity(item)} units
                      </Text>
                      <Text style={styles.skuLocations}>
                        {item.locations.length} location{item.locations.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Orders Panel */}
          {showOrders && (
            <View style={styles.ordersPanel}>
              <Text style={styles.ordersTitle}>Orders</Text>
              
              {/* Order Status Tabs */}
              <View style={styles.ordersTabs}>
                <Pressable
                  onPress={() => setOrdersTab('awaiting')}
                  style={[
                    styles.orderTab,
                    ordersTab === 'awaiting' && styles.orderTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.orderTabText,
                      ordersTab === 'awaiting' && styles.orderTabTextActive,
                    ]}
                  >
                    Awaiting
                  </Text>
                  {orders.filter(o => o.status === 'awaiting').length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>
                        {orders.filter(o => o.status === 'awaiting').length}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setOrdersTab('picking')}
                  style={[
                    styles.orderTab,
                    ordersTab === 'picking' && styles.orderTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.orderTabText,
                      ordersTab === 'picking' && styles.orderTabTextActive,
                    ]}
                  >
                    Picking
                  </Text>
                  {orders.filter(o => o.status === 'picking').length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>
                        {orders.filter(o => o.status === 'picking').length}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setOrdersTab('picked')}
                  style={[
                    styles.orderTab,
                    ordersTab === 'picked' && styles.orderTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.orderTabText,
                      ordersTab === 'picked' && styles.orderTabTextActive,
                    ]}
                  >
                    Picked
                  </Text>
                  {orders.filter(o => o.status === 'picked').length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>
                        {orders.filter(o => o.status === 'picked').length}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Orders List */}
              <ScrollView style={styles.ordersList}>
                {filteredOrders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No orders in this status
                    </Text>
                  </View>
                ) : (
                  filteredOrders.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderCardHeader}>
                        <Text style={styles.orderId}>{order.id}</Text>
                        <View
                          style={[
                            styles.priorityBadge,
                            {
                              backgroundColor:
                                order.priority === 'high'
                                  ? '#ef4444'
                                  : order.priority === 'medium'
                                  ? '#f59e0b'
                                  : '#10b981',
                            },
                          ]}
                        >
                          <Text style={styles.priorityText}>
                            {order.priority}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderCardBody}>
                        <Text style={styles.orderItemCount}>
                          {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.orderDate}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {/* Order Items */}
                      <View style={styles.orderItemsContainer}>
                        {order.items.map((orderItem) => {
                          const item = items.find(i => i.id === orderItem.itemId)
                          const isSelected = sharedSnapshot.selectedOrderItem?.orderId === order.id && 
                                             sharedSnapshot.selectedOrderItem?.itemId === orderItem.itemId &&
                                             sharedSnapshot.selectedOrderItem?.location === orderItem.location
                          const hasQRCode = sharedSnapshot.activeQRCodes.has(orderItem.location)
                          
                          return (
                            <View
                              key={`${order.id}-${orderItem.itemId}-${orderItem.location}`}
                              style={[
                                styles.orderItemRow,
                                isSelected && styles.orderItemRowSelected,
                                hasQRCode && styles.orderItemRowHasQR,
                              ]}
                            >
                              <View style={styles.orderItemInfo}>
                                <Text style={styles.orderItemId}>{orderItem.itemId}</Text>
                                <Text style={styles.orderItemName}>{item?.name || 'Unknown Item'}</Text>
                                <Text style={styles.orderItemLocation}>Location: {orderItem.location}</Text>
                              </View>
                              <View style={styles.orderItemQuantity}>
                                <Text style={styles.orderItemQuantityText}>
                                  {orderItem.pickedQuantity} / {orderItem.quantity}
                                </Text>
                                {hasQRCode && (
                                  <View style={styles.qrActiveBadge}>
                                    <Text style={styles.qrActiveBadgeText}>QR</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Active QR Codes Panel */}
        {sharedSnapshot.activeQRCodes.size > 0 && (
          <View style={styles.qrPanel}>
            <Text style={styles.qrPanelTitle}>
              Active QR Codes ({sharedSnapshot.activeQRCodes.size})
            </Text>
            <ScrollView style={styles.qrList}>
              {Array.from(sharedSnapshot.activeQRCodes.entries()).map(([location, { data, imageUri }]) => (
                <Pressable
                  key={location}
                  onPress={() => {
                    setSelectedQRCode(location)
                    setModalVisible(true)
                  }}
                  style={styles.qrItem}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.qrThumbnail}
                  />
                  <View style={styles.qrInfo}>
                    <Text style={styles.qrShelfId}>Location: {location}</Text>
                    <Text style={styles.qrItemId}>{data.itemId}</Text>
                    {data.orderId && (
                      <Text style={styles.qrOrderId}>Order: {data.orderId}</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation()
                      removeQRCode(location)
                    }}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* QR Code Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  QR Code for {selectedQRCode}
                </Text>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>

              {selectedQRCode && sharedSnapshot.activeQRCodes.has(selectedQRCode) && (
                <View style={styles.modalBody}>
                  <Image
                    source={{ uri: sharedSnapshot.activeQRCodes.get(selectedQRCode)!.imageUri }}
                    style={styles.qrImage}
                  />
                  <View style={styles.qrDetails}>
                    <Text style={styles.qrLabel}>Item ID:</Text>
                    <Text style={styles.qrValue}>{sharedSnapshot.activeQRCodes.get(selectedQRCode)!.data.itemId}</Text>
                    
                    <Text style={styles.qrLabel}>Location:</Text>
                    <Text style={styles.qrValue}>{sharedSnapshot.activeQRCodes.get(selectedQRCode)!.data.location}</Text>
                    
                    {sharedSnapshot.activeQRCodes.get(selectedQRCode)!.data.orderId && (
                      <>
                        <Text style={styles.qrLabel}>Order ID:</Text>
                        <Text style={styles.qrValue}>{sharedSnapshot.activeQRCodes.get(selectedQRCode)!.data.orderId}</Text>
                      </>
                    )}
                    
                    <Text style={styles.qrLabel}>Data (JSON):</Text>
                    <Text style={styles.qrJson}>
                      {JSON.stringify(sharedSnapshot.activeQRCodes.get(selectedQRCode)!.data, null, 2)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      removeQRCode(selectedQRCode)
                      setModalVisible(false)
                    }}
                    style={styles.removeLargeButton}
                  >
                    <Text style={styles.removeLargeButtonText}>Remove QR Code</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* User Menu */}
        <UserMenu 
          visible={userMenuVisible} 
          onClose={() => setUserMenuVisible(false)} 
        />

        {/* Pairing QR Code Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPairingModal}
          onRequestClose={() => setShowPairingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pairing QR Code</Text>
                <Pressable
                  onPress={() => setShowPairingModal(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.pairingInstructions}>
                  Scan this QR code with a picker device to pair with this warehouse session.
                </Text>
                {pairingQRCodeUri && (
                  <Image
                    source={{ uri: pairingQRCodeUri }}
                    style={styles.pairingQRImage}
                  />
                )}
                
                {/* Pairing Link Section */}
                {pairingCode && (
                  <View style={styles.pairingCodeContainer}>
                    <Text style={styles.pairingCodeLabel}>
                      Or open this link on picker device:
                    </Text>
                    <Pressable
                      onPress={() => {
                        navigator.clipboard.writeText(pairingCode)
                        setCodeCopied(true)
                        setTimeout(() => setCodeCopied(false), 2000)
                      }}
                      style={styles.pairingCodeBox}
                    >
                      <Text style={styles.pairingCodeText} numberOfLines={1}>
                        {pairingCode}
                      </Text>
                      <Text style={styles.copyIndicator}>
                        {codeCopied ? 'Copied!' : 'Click to copy'}
                      </Text>
                    </Pressable>
                    <Text style={styles.pairingLinkHint}>
                      Paste in browser to auto-connect picker
                    </Text>
                  </View>
                )}
                
                {sharedSnapshot.sessionId && (
                  <Text style={styles.sessionIdText}>
                    Session ID: {sharedSnapshot.sessionId}
                  </Text>
                )}
                <View style={styles.connectionStatus}>
                  <View
                    style={[
                      styles.statusIndicator,
                      sharedSnapshot.wsConnected
                        ? styles.statusIndicatorConnected
                        : styles.statusIndicatorDisconnected,
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {sharedSnapshot.wsConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  )
}

// Helper function to get color for category
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    electronics: '#3b82f6',
    accessories: '#8b5cf6',
    computers: '#10b981',
    mobile: '#f59e0b',
    audio: '#ef4444',
    clothing: '#ec4899',
    food: '#84cc16',
    tools: '#6b7280',
    home: '#14b8a6',
  }
  return colors[category.toLowerCase()] || '#6b7280'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  navHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717a',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
  },
  navHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#18181b',
  },
  navHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userAvatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  adminBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconButtonActive: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  gridContainer: {
    flex: 1,
  },
  gridContainerShrink: {
    flex: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  shelfContainer: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  shelf: {
    width: 70,
    height: 70,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  shelfActive: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  shelfPressed: {
    backgroundColor: '#e0e0e0',
  },
  shelfText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
  },
  qrIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qrIndicatorText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  qrOverlay: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
    minWidth: 15,
    minHeight: 15,
  },
  qrOverlayImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  inventoryPanel: {
    flex: 0.5,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 12,
  },
  ordersPanel: {
    flex: 0.5,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 12,
  },
  inventoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 12,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  resetButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginLeft: 8,
  },
  resetButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#71717a',
    lineHeight: 20,
  },
  inventoryList: {
    flex: 1,
  },
  skuItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  skuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skuId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    fontFamily: 'monospace',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  skuName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 2,
  },
  skuDescription: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 8,
  },
  skuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skuQuantity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  skuLocations: {
    fontSize: 12,
    color: '#71717a',
  },
  qrPanel: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 16,
    maxHeight: 200,
  },
  qrPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 12,
  },
  qrList: {
    flexGrow: 0,
  },
  qrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  qrThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  qrInfo: {
    flex: 1,
    marginLeft: 12,
  },
  qrShelfId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
  },
  qrItemId: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  itemCountBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: '#10b981',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  removeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#18181b',
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#71717a',
  },
  modalBody: {
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  qrDetails: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    marginTop: 8,
  },
  qrValue: {
    fontSize: 14,
    color: '#18181b',
    marginTop: 2,
  },
  qrJson: {
    fontSize: 10,
    color: '#71717a',
    fontFamily: 'monospace',
    marginTop: 4,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  removeLargeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  removeLargeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  ordersTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    marginBottom: 12,
    gap: 4,
  },
  orderTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  orderTabActive: {
    borderBottomColor: '#18181b',
  },
  orderTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717a',
  },
  orderTabTextActive: {
    color: '#18181b',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ordersList: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#71717a',
  },
  orderCard: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  orderCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemCount: {
    fontSize: 14,
    color: '#71717a',
  },
  orderDate: {
    fontSize: 12,
    color: '#71717a',
  },
  orderItemsContainer: {
    marginTop: 12,
    gap: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  orderItemRowSelected: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  orderItemRowHasQR: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 2,
  },
  orderItemLocation: {
    fontSize: 12,
    color: '#71717a',
  },
  orderItemQuantity: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderItemQuantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
  },
  qrActiveBadge: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qrActiveBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  qrOrderId: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  pairingInstructions: {
    fontSize: 14,
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 16,
  },
  pairingQRImage: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  sessionIdText: {
    fontSize: 12,
    color: '#71717a',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusIndicatorConnected: {
    backgroundColor: '#10b981',
  },
  statusIndicatorDisconnected: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    color: '#18181b',
    fontWeight: '500',
  },
  pairingCodeContainer: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  pairingCodeLabel: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 8,
  },
  pairingCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  pairingCodeText: {
    flex: 1,
    fontSize: 11,
    color: '#18181b',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
    overflow: 'hidden',
  },
  copyIndicator: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  pairingLinkHint: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 8,
    fontStyle: 'italic',
  },
})