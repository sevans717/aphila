// CreatE - Content creation functionality
// TODO: Implement content creation tools and editing features
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

interface CreationTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "photo" | "video" | "text" | "design";
}

const CreatEScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState<
    "photo" | "video" | "text" | "design"
  >("photo");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const creationTools: CreationTool[] = [
    // Photo Tools
    {
      id: "photo_edit",
      name: "Photo Editor",
      icon: "🖼️",
      description: "Edit photos with filters and adjustments",
      category: "photo",
    },
    {
      id: "collage",
      name: "Collage Maker",
      icon: "🧩",
      description: "Create photo collages",
      category: "photo",
    },
    {
      id: "sticker",
      name: "Sticker Studio",
      icon: "🎨",
      description: "Add stickers and overlays",
      category: "photo",
    },

    // Video Tools
    {
      id: "video_edit",
      name: "Video Editor",
      icon: "🎬",
      description: "Trim, merge, and edit videos",
      category: "video",
    },
    {
      id: "music",
      name: "Add Music",
      icon: "🎵",
      description: "Add background music to videos",
      category: "video",
    },
    {
      id: "effects",
      name: "Video Effects",
      icon: "✨",
      description: "Apply effects and transitions",
      category: "video",
    },

    // Text Tools
    {
      id: "text_post",
      name: "Text Post",
      icon: "📝",
      description: "Create text-based posts",
      category: "text",
    },
    {
      id: "quote",
      name: "Quote Maker",
      icon: "💬",
      description: "Create inspirational quotes",
      category: "text",
    },
    {
      id: "story",
      name: "Story Creator",
      icon: "📖",
      description: "Write and format stories",
      category: "text",
    },

    // Design Tools
    {
      id: "template",
      name: "Templates",
      icon: "📋",
      description: "Use pre-made templates",
      category: "design",
    },
    {
      id: "canvas",
      name: "Canvas",
      icon: "🎨",
      description: "Create from scratch",
      category: "design",
    },
    {
      id: "meme",
      name: "Meme Generator",
      icon: "😂",
      description: "Create funny memes",
      category: "design",
    },
  ];

  const getToolsByCategory = (category: string) => {
    return creationTools.filter((tool) => tool.category === category);
  };

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    const tool = creationTools.find((t) => t.id === toolId);
    if (tool) {
      Alert.alert("Tool Selected", `Opening ${tool.name}...`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => console.log(`Opening ${tool.name}`),
        },
      ]);
    }
  };

  const handleCreatePost = () => {
    if (!selectedTool) {
      Alert.alert("Select Tool", "Please select a creation tool first");
      return;
    }

    Alert.alert("Create Post", "Ready to create your post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Create",
        onPress: () => {
          console.log("Creating post with:", { tool: selectedTool, caption });
          Alert.alert("Success", "Post created successfully!");
          setCaption("");
          setSelectedTool(null);
        },
      },
    ]);
  };

  const renderTool = (tool: CreationTool) => (
    <TouchableOpacity
      key={tool.id}
      style={[
        styles.toolCard,
        selectedTool === tool.id && styles.selectedToolCard,
      ]}
      onPress={() => handleToolSelect(tool.id)}
      activeOpacity={0.7}
    >
      <View style={styles.toolIcon}>
        <Text style={styles.toolIconText}>{tool.icon}</Text>
      </View>

      <View style={styles.toolInfo}>
        <Text style={styles.toolName}>{tool.name}</Text>
        <Text style={styles.toolDescription} numberOfLines={2}>
          {tool.description}
        </Text>
      </View>

      {selectedTool === tool.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const currentTools = getToolsByCategory(activeCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePost}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryTab,
            activeCategory === "photo" && styles.activeCategoryTab,
          ]}
          onPress={() => setActiveCategory("photo")}
        >
          <Text
            style={[
              styles.categoryText,
              activeCategory === "photo" && styles.activeCategoryText,
            ]}
          >
            📸 Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryTab,
            activeCategory === "video" && styles.activeCategoryTab,
          ]}
          onPress={() => setActiveCategory("video")}
        >
          <Text
            style={[
              styles.categoryText,
              activeCategory === "video" && styles.activeCategoryText,
            ]}
          >
            🎬 Video
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryTab,
            activeCategory === "text" && styles.activeCategoryTab,
          ]}
          onPress={() => setActiveCategory("text")}
        >
          <Text
            style={[
              styles.categoryText,
              activeCategory === "text" && styles.activeCategoryText,
            ]}
          >
            📝 Text
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryTab,
            activeCategory === "design" && styles.activeCategoryTab,
          ]}
          onPress={() => setActiveCategory("design")}
        >
          <Text
            style={[
              styles.categoryText,
              activeCategory === "design" && styles.activeCategoryText,
            ]}
          >
            🎨 Design
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tools Grid */}
      <ScrollView
        style={styles.toolsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}{" "}
          Tools
        </Text>

        <View style={styles.toolsGrid}>{currentTools.map(renderTool)}</View>

        {/* Caption Input */}
        {selectedTool && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionLabel}>Add a caption:</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Write something about your creation..."
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={280}
              placeholderTextColor="#999"
            />
            <Text style={styles.captionCount}>{caption.length}/280</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>📚 Templates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>🎯 Inspiration</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>💡 Ideas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {selectedTool && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>💾 Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={handleCreatePost}
          >
            <Text style={[styles.actionButtonText, styles.primaryActionText]}>
              🚀 Publish
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2196f3",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  createButton: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 15,
    borderRadius: 25,
    padding: 5,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  activeCategoryTab: {
    backgroundColor: "#2196f3",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  activeCategoryText: {
    color: "white",
  },
  toolsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 15,
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  toolCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    width: (width - 45) / 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  selectedToolCard: {
    borderWidth: 2,
    borderColor: "#2196f3",
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  toolIconText: {
    fontSize: 25,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  toolDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  selectedIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#2196f3",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  captionContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  captionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    color: "#333",
  },
  captionCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  quickActionButton: {
    backgroundColor: "white",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: (width - 45) / 3,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2196f3",
  },
  actionBar: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  primaryActionButton: {
    backgroundColor: "#2196f3",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  primaryActionText: {
    color: "white",
  },
});

export default CreatEScreen;
