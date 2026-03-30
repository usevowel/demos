import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useSnapshot } from 'valtio'
import { FaUserCircle, FaSignOutAlt, FaRedo } from 'react-icons/fa'
import { sharedState, logoutUser, resetDemo } from '../lib/store'

/**
 * Icon component that works with react-icons for web and provides fallback for native
 */
const Icon = ({ name, size = 20, color = '#18181b' }: { name: 'user' | 'logout' | 'reset'; size?: number; color?: string }) => {
  if (Platform.OS === 'web') {
    if (name === 'user') {
      return <FaUserCircle size={size} color={color} />
    } else if (name === 'logout') {
      return <FaSignOutAlt size={size} color={color} />
    } else if (name === 'reset') {
      return <FaRedo size={size} color={color} />
    }
  }
  
  // Fallback for native
  const iconMap: Record<string, string> = {
    user: '👤',
    logout: '🚪',
    reset: '🔄',
  }
  return <Text style={{ fontSize: size, color }}>{iconMap[name] || '👤'}</Text>
}

/**
 * User Menu Component
 * 
 * Displays a dropdown menu with user info, logout, and reset demo options
 */
interface UserMenuProps {
  /** Whether the menu is visible */
  visible: boolean
  /** Callback when menu should be closed */
  onClose: () => void
}

export default function UserMenu({ visible, onClose }: UserMenuProps) {
  const router = useRouter()
  const snapshot = useSnapshot(sharedState)
  const user = snapshot.currentUser

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logoutUser()
    onClose()
    router.replace('/')
  }

  /**
   * Handle reset demo
   */
  const handleResetDemo = () => {
    resetDemo()
    onClose()
    // Show a brief confirmation (could be enhanced with a toast notification)
  }

  if (!user) {
    return null
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu} onStartShouldSetResponder={() => true}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userIconContainer}>
              <Icon name="user" size={24} color="#18181b" />
              {user.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>A</Text>
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>
                {user.role === 'admin' ? 'Admin' : 'Picker'}
              </Text>
            </View>
          </View>

          {/* Menu Divider */}
          <View style={styles.divider} />

          {/* Menu Items */}
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={handleResetDemo}
          >
            <Icon name="reset" size={18} color="#71717a" />
            <Text style={styles.menuItemText}>Reset Demo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              styles.menuItemDanger,
              pressed && styles.menuItemPressed,
            ]}
            onPress={handleLogout}
          >
            <Icon name="logout" size={18} color="#ef4444" />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
              Logout
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 240,
    padding: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  userIconContainer: {
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 11,
    color: '#71717a',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 6,
  },
  menuItemPressed: {
    backgroundColor: '#f4f4f5',
  },
  menuItemDanger: {
    // Danger styling for logout
  },
  menuItemText: {
    fontSize: 14,
    color: '#18181b',
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: '#ef4444',
  },
})
