import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootNavigationParamList } from "../../navigation/types";
import TabNavBar from "../../components/navigation/TabNavBar";

type CategoryScreenNavigationProp = NativeStackNavigationProp<
  RootNavigationParamList,
  "CategoryScreen"
>;

const CategoryScreen: React.FC = () => {
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  // Create a simple 4x4 grid (16 tiles) with the same icon
  const tiles = Array.from({ length: 16 }, (_, index) => ({
    id: index + 1,
    name: `Tile ${index + 1}`,
  }));

  const handleTilePress = (tileId: number) => {
    // Navigate to the corresponding tile screen
    const screenName = `Tile${tileId}Screen` as keyof RootNavigationParamList;
    navigation.navigate(screenName as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Category</Text>
        <Text style={styles.subtitle}>Explore categories</Text>

        <View style={styles.tilesGrid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={styles.tile}
              onPress={() => handleTilePress(tile.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tileIcon}>
                <Text style={styles.iconText}>⬜</Text>
              </View>
              <Text style={styles.tileName}>{tile.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TabNavBar />
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#6366f1",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 40,
  },
  tilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "23%", // 4 tiles per row with spacing
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconText: {
    fontSize: 16,
    color: "#ffffff",
  },
  tileName: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default CategoryScreen;
