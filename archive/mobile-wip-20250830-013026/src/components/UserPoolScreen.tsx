import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";

interface User {
  id: string;
  name: string;
  age: number;
  interests: string[];
  online: boolean;
}

interface UserPoolProps {
  tileId: number;
  tileName: string;
}

const UserPoolScreen: React.FC<UserPoolProps> = ({ tileId, tileName }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Simulate joining the tile category and loading user pool
    // In a real app, this would fetch users from the backend
    const mockUsers: User[] = [
      {
        id: "1",
        name: "Alex",
        age: 28,
        interests: ["Music", "Travel"],
        online: true,
      },
      {
        id: "2",
        name: "Jordan",
        age: 25,
        interests: ["Sports", "Gaming"],
        online: true,
      },
      {
        id: "3",
        name: "Taylor",
        age: 30,
        interests: ["Art", "Cooking"],
        online: false,
      },
      {
        id: "4",
        name: "Morgan",
        age: 27,
        interests: ["Books", "Movies"],
        online: true,
      },
      {
        id: "5",
        name: "Casey",
        age: 26,
        interests: ["Fitness", "Nature"],
        online: true,
      },
      {
        id: "6",
        name: "Riley",
        age: 29,
        interests: ["Photography", "Tech"],
        online: true,
      },
      {
        id: "7",
        name: "Avery",
        age: 24,
        interests: ["Dance", "Music"],
        online: false,
      },
      {
        id: "8",
        name: "Quinn",
        age: 31,
        interests: ["Writing", "Coffee"],
        online: true,
      },
    ];

    const mockCurrentUser: User = {
      id: "current",
      name: "You",
      age: 25,
      interests: ["Tech", "Music"],
      online: true,
    };

    setUsers(mockUsers);
    setCurrentUser(mockCurrentUser);
  }, [tileId]);

  const handleMatchRequest = (userId: string) => {
    // Handle match request logic here
    console.log(`Match request sent to user ${userId} in ${tileName}`);
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <Text style={styles.userName}>{item.name}</Text>
        <View style={[styles.onlineIndicator, item.online && styles.online]} />
      </View>
      <Text style={styles.userAge}>{item.age} years old</Text>
      <View style={styles.interestsContainer}>
        {item.interests.map((interest, index) => (
          <Text key={index} style={styles.interestTag}>
            {interest}
          </Text>
        ))}
      </View>
      <TouchableOpacity
        style={styles.matchButton}
        onPress={() => handleMatchRequest(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.matchButtonText}>Match</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>{tileName} Community</Text>
        <Text style={styles.subtitle}>
          Find your perfect match in this category
        </Text>

        {currentUser && (
          <View style={styles.currentUserCard}>
            <Text style={styles.currentUserLabel}>You are in this pool:</Text>
            <Text style={styles.currentUserName}>{currentUser.name}</Text>
            <View style={styles.interestsContainer}>
              {currentUser.interests.map((interest, index) => (
                <Text key={index} style={styles.interestTag}>
                  {interest}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.poolTitle}>
          Available to Match ({users.length})
        </Text>

        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item: User) => item.id}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.usersList}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 80, // Account for home button
    paddingHorizontal: 20,
    paddingBottom: 100, // Account for tab bar
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6366f1",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 30,
  },
  currentUserCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#6366f1",
  },
  currentUserLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  currentUserName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 12,
  },
  poolTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  usersList: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6b7280",
  },
  online: {
    backgroundColor: "#10b981",
  },
  userAge: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  interestTag: {
    backgroundColor: "#374151",
    color: "#d1d5db",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  matchButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  matchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserPoolScreen;
