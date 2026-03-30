import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { loginUser, getAvailableUsers, User } from '../lib/store'

/**
 * User Selection Component
 * 
 * Displays available users for login selection
 */
export default function UserSelection() {
  const router = useRouter()
  const users = getAvailableUsers()

  /**
   * Handle user selection and login
   */
  const handleUserSelect = (user: User) => {
    const loggedInUser = loginUser(user.id)
    if (loggedInUser) {
      // Navigate to user's default page
      router.replace(loggedInUser.defaultPage as any)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Pickr</Text>
          <Text style={styles.subtitle}>
            Select a user to continue
          </Text>
        </View>
        
        <View style={styles.usersList}>
          {users.map((user) => (
            <Pressable
              key={user.id}
              style={({ pressed }) => [
                styles.userButton,
                pressed && styles.userButtonPressed,
              ]}
              onPress={() => handleUserSelect(user)}
            >
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>
                  {user.role === 'admin' ? 'Admin' : 'Picker'}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#18181b',
  },
  subtitle: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 8,
  },
  usersList: {
    gap: 12,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fafafa',
  },
  userButtonPressed: {
    opacity: 0.7,
    backgroundColor: '#f4f4f5',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#71717a',
    textTransform: 'capitalize',
  },
  arrow: {
    fontSize: 20,
    color: '#71717a',
    marginLeft: 12,
  },
})
