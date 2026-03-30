import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useSnapshot } from 'valtio'
import { sharedState, initializeUserState } from '../lib/store'
import UserSelection from '../components/UserSelection'

/**
 * Home Page
 * 
 * Shows user selection if not logged in, otherwise redirects to user's default page
 */
export default function HomePage() {
  const router = useRouter()
  const snapshot = useSnapshot(sharedState)

  // Initialize user state from localStorage on mount
  useEffect(() => {
    initializeUserState()
  }, [])

  // Redirect to user's default page if logged in
  useEffect(() => {
    if (snapshot.currentUser) {
      router.replace(snapshot.currentUser.defaultPage as any)
    }
  }, [snapshot.currentUser, router])

  // Show user selection if not logged in
  if (!snapshot.currentUser) {
    return <UserSelection />
  }

  // Show loading state while redirecting
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.loadingText}>Loading...</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#71717a',
  },
})