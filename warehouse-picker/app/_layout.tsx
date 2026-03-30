import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { initializeUserState } from '../lib/store'

/**
 * Root Layout Component
 * 
 * Initializes app-wide state and sets up navigation
 */
export default function Layout() {
  // Initialize user state from localStorage on app start
  useEffect(() => {
    initializeUserState()
  }, [])

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Pickr',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="warehouse" 
        options={{ 
          title: 'Warehouse',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="pick" 
        options={{ 
          title: 'Picker',
          headerShown: false 
        }} 
      />
    </Stack>
  )
}