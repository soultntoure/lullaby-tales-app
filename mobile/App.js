import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import Sound from 'react-native-sound';

// --- Redux Setup (Simplified for demonstration) ---
const storySlice = createSlice({
  name: 'story',
  initialState: {
    currentStory: null,
    isLoading: false,
    error: null,
    childProfiles: [
        { id: 1, name: 'Lily', interests: 'unicorns, space' },
        { id: 2, name: 'Max', interests: 'dinosaurs, cars' }
    ] // Dummy child profiles
  },
  reducers: {
    fetchStoryStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.currentStory = null;
    },
    fetchStorySuccess: (state, action) => {
      state.isLoading = false;
      state.currentStory = action.payload;
    },
    fetchStoryFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchStoryStart, fetchStorySuccess, fetchStoryFailure } = storySlice.actions;

const store = configureStore({
  reducer: {
    story: storySlice.reducer,
  },
});

// --- Story Generation Screen ---
function StoryGenerationScreen({ navigation }) {
  const [childId, setChildId] = useState('1'); 
  const [dailyEvent, setDailyEvent] = useState('');
  const [friendName, setFriendName] = useState('');
  const [moral, setMoral] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateStory = async () => {
    if (!dailyEvent.trim() || !moral.trim()) {
      Alert.alert("Missing Details", "Please provide a daily event and desired moral for the story.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const child = store.getState().story.childProfiles.find(c => c.id === parseInt(childId));
      if (!child) {
        setError("Child not found.");
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy_token' // IMPORTANT: Replace with actual JWT from login
        },
        body: JSON.stringify({
          child_id: parseInt(childId),
          prompt_details: {
            child_name: child.name,
            daily_event: dailyEvent.trim(),
            friend_name: friendName.trim(),
            moral: moral.trim(),
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.navigate('StoryDisplay', { storyText: data.story_text, audioUrl: data.audio_url });
      } else {
        setError(data.detail || 'Failed to generate story. Please try again.');
      }
    } catch (err) {
      setError('Network error or server unavailable. Please check your connection.');
      console.error("API Call Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Your Personalized Bedtime Story</Text>
      <Text style={styles.label}>Child Name:</Text>
      <TextInput
        style={styles.input}
        value={store.getState().story.childProfiles.find(c => c.id === parseInt(childId))?.name || 'Select Child'}
        editable={false}
      />
      <Text style={styles.label}>What happened today? (e.g., "went to the park")</Text>
      <TextInput
        style={styles.input}
        onChangeText={setDailyEvent}
        value={dailyEvent}
        placeholder="e.g., played with blocks at daycare" 
        multiline
      />
      <Text style={styles.label}>Who did they play with? (optional)</Text>
      <TextInput
        style={styles.input}
        onChangeText={setFriendName}
        value={friendName}
        placeholder="e.g., their friend Maya"
      />
      <Text style={styles.label}>Desired moral for the story (e.g., "sharing is caring"):</Text>
      <TextInput
        style={styles.input}
        onChangeText={setMoral}
        value={moral}
        placeholder="e.g., always be kind"
        multiline
      />
      <Button title={loading ? "Generating Story..." : "Generate Story"} onPress={handleGenerateStory} disabled={loading} />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.activityIndicator} />}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <StatusBar style="auto" />
    </ScrollView>
  );
}

// --- Story Display Screen ---
function StoryDisplayScreen({ route }) {
  const { storyText, audioUrl } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    Sound.setCategory('Playback');
    if (audioUrl) {
      const newSound = new Sound(audioUrl, null, (error) => {
        if (error) {
          console.log('Failed to load the sound', error);
          Alert.alert("Audio Error", "Could not load story audio. Please try again.");
          return;
        }
        soundRef.current = newSound;
      });
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.release();
        soundRef.current = null;
      }
    };
  }, [audioUrl]);

  const playStopSound = () => {
    if (!soundRef.current) {
      Alert.alert("Audio Not Ready", "Audio is still loading or unavailable. Please wait or try again.");
      return;
    }

    if (isPlaying) {
      soundRef.current.pause(() => {
        console.log('Playback paused');
        setIsPlaying(false);
      });
    } else {
      soundRef.current.play((success) => {
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.log('Playback failed:', soundRef.current.getError());
          Alert.alert("Playback Error", "Failed to play audio. Please try again.");
        }
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Personalized Bedtime Story</Text>
      <Text style={styles.storyText}>{storyText}</Text>
      {audioUrl ? (
        <View style={styles.audioControls}>
          <Button title={isPlaying ? "Pause Audio" : "Play Audio"} onPress={playStopSound} />
        </View>
      ) : (
        <Text style={styles.noAudioText}>No audio available for this story.</Text>
      )}
      <StatusBar style="auto" />
    </ScrollView>
  );
}

// --- Navigation Setup ---
const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="StoryGeneration">
          <Stack.Screen name="StoryGeneration" component={StoryGenerationScreen} options={{ title: 'Create Bedtime Story' }} />
          <Stack.Screen name="StoryDisplay" component={StoryDisplayScreen} options={{ title: 'Your Story' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: 'flex-start',
    marginLeft: '5%',
    width: '90%'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    width: '90%',
    backgroundColor: '#fff',
    fontSize: 16,
    minHeight: 40,
  },
  storyText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'justify',
    marginBottom: 20,
    paddingHorizontal: 10,
    color: '#555',
  },
  audioControls: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  activityIndicator: {
    marginTop: 20,
  },
  noAudioText: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#888',
  }
});
