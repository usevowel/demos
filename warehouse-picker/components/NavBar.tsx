import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import { useSnapshot } from 'valtio'
import { FaUserCircle } from 'react-icons/fa'
import { sharedState } from '../lib/store'

/**
 * Icon component that works with react-icons for web and provides fallback for native
 */
const Icon = ({ name, size = 20, color = '#18181b' }: { name: 'user'; size?: number; color?: string }) => {
  if (Platform.OS === 'web') {
    if (name === 'user') {
      return <FaUserCircle size={size} color={color} />
    }
  }
  
  // Fallback for native
  const iconMap: Record<string, string> = {
    user: '👤',
  }
  return <Text style={{ fontSize: size, color }}>{iconMap[name] || '👤'}</Text>
}

/**
 * NavBar Props
 */
interface NavBarProps {
  /** Page title to display next to logo */
  title: string
  /** Optional action buttons (e.g., inventory, orders) */
  actions?: React.ReactNode
  /** Callback when user avatar is clicked */
  onUserClick?: () => void
}

/**
 * Reusable Navigation Bar Component
 * 
 * Displays:
 * - Logo ("vowel | pickr")
 * - Page title
 * - Optional action buttons
 * - User avatar button with admin badge if admin
 */
export default function NavBar({ title, actions, onUserClick }: NavBarProps) {
  const snapshot = useSnapshot(sharedState)
  const isAdmin = snapshot.currentUser?.role === 'admin'

  return (
    <View style={styles.navHeader}>
      <View style={styles.navHeaderLeft}>
        <Text style={styles.logo}>vowel | pickr</Text>
        <Text style={styles.navHeaderTitle}>{title}</Text>
      </View>
      <View style={styles.navHeaderRight}>
        {actions && (
          <View style={styles.navHeaderActions}>
            {actions}
          </View>
        )}
        <Pressable 
          style={styles.userAvatarButton}
          onPress={onUserClick}
        >
          <Icon name="user" size={24} color="#18181b" />
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>A</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
})
