import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  distance: string;
}

const MatcHScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock data - replace with real API data
  const mockProfiles: UserProfile[] = [
    {
      id: "1",
      name: "Alex",
      age: 28,
      bio: "Adventure seeker, coffee lover, and weekend hiker. Looking for someone to explore the world with!",
      interests: ["Hiking", "Coffee", "Travel", "Photography"],
      distance: "2.3 km",
    },
    {
      id: "2",
      name: "Jordan",
      age: 25,
      bio: "Tech enthusiast by day, musician by night. Love coding, playing guitar, and good conversations.",
      interests: ["Coding", "Music", "Gaming", "Books"],
      distance: "1.8 km",
    },
    {
      id: "3",
      name: "Taylor",
      age: 30,
      bio: "Foodie and fitness lover. Always trying new recipes and hitting the gym. Let's cook together!",
      interests: ["Cooking", "Fitness", "Food", "Yoga"],
      distance: "3.1 km",
    },
  ];

  const onGestureEvent = (_event: PanGestureHandlerGestureEvent) => {
    // Handle swipe gestures
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX > 100) {
        // Swipe right - like
        handleLike();
      } else if (translationX < -100) {
        // Swipe left - pass
        handlePass();
      }
    }
  };

  const handleLike = () => {
    console.log("Liked profile:", mockProfiles[currentIndex]?.name);
    if (currentIndex < mockProfiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reset to first profile or show "no more profiles"
      setCurrentIndex(0);
    }
  };

  const handlePass = () => {
    console.log("Passed on profile:", mockProfiles[currentIndex]?.name);
    if (currentIndex < mockProfiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reset to first profile or show "no more profiles"
      setCurrentIndex(0);
    }
  };

  const currentProfile = mockProfiles[currentIndex];

  if (!currentProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.noProfilesText}>No more profiles to show!</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => setCurrentIndex(0)}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Your Match</Text>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>
                {currentProfile.name}, {currentProfile.age}
              </Text>
              <Text style={styles.distance}>{currentProfile.distance}</Text>
            </View>

            <Text style={styles.bio}>{currentProfile.bio}</Text>

            <View style={styles.interestsContainer}>
              {currentProfile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </PanGestureHandler>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.passButton} onPress={handlePass}>
          <Text style={styles.buttonText}>✗ Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Text style={styles.buttonText}>♥ Like</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instruction}>
        Swipe left to pass, right to like, or tap buttons
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  distance: {
    fontSize: 14,
    color: "#666",
  },
  bio: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 15,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    backgroundColor: "#e1f5fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: "#0277bd",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  passButton: {
    backgroundColor: "#ff5252",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  likeButton: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  instruction: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  noProfilesText: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: "center",
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MatcHScreen;
