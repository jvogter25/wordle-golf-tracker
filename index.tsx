import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Link } from 'expo-router'

export default function HomePage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏌️ Wordle Golf Tracker</Text>
      <Text style={styles.subtitle}>Family Competition Made Easy</Text>
      
      <View style={styles.buttonContainer}>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>View Demo</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <Text style={styles.description}>
        Transform your family's daily Wordle into an exciting golf-style tournament!
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fffe',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#059669',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#059669',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#059669',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});