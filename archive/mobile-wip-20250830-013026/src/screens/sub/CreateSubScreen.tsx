import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import TabNavBar from "../../components/navigation/TabNavBar";
import { useCommunityStore } from "../../stores/modules/communityStore";
import { useMediaStore } from "../../stores/modules/mediaStore";
import { PostType } from "../../types/community";

const CreateSubScreen: React.FC = () => {
  const navigation = useNavigation();
  const [postType, setPostType] = useState<PostType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  // Store hooks
  const { createPost, saveDraftPost, isCreatingPost, selectedCategoryId } =
    useCommunityStore();
  const { uploadMedia } = useMediaStore();

  const handlePostTypeChange = (type: PostType) => {
    setPostType(type);
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert("Error", "Please select a category first");
      return;
    }

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await createPost(
        selectedCategoryId,
        content,
        title,
        postType,
        [], // media will be handled separately
        tagsArray
      );

      Alert.alert("Success", "Your post has been published!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setTitle("");
            setContent("");
            setTags("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to publish post:", error);
      Alert.alert("Error", "Failed to publish post. Please try again.");
    }
  };

  const handleSaveDraft = () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please add some content before saving as draft");
      return;
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const draft = {
      title: title || undefined,
      content,
      type: postType,
      tags: tagsArray,
      categoryId: selectedCategoryId || "default",
    };

    saveDraftPost(draft);

    Alert.alert("Draft Saved", "Your draft has been saved successfully", [
      {
        text: "OK",
        onPress: () => {
          // Reset form
          setTitle("");
          setContent("");
          setTags("");
        },
      },
    ]);
  };

  const renderTextEditor = () => (
    <View style={styles.editorContainer}>
      <TextInput
        style={styles.titleInput}
        placeholder="Post title..."
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <TextInput
        style={styles.contentInput}
        placeholder="Write your post content here..."
        placeholderTextColor="#9ca3af"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <TextInput
        style={styles.tagsInput}
        placeholder="Add tags (separated by commas)..."
        placeholderTextColor="#9ca3af"
        value={tags}
        onChangeText={setTags}
      />
    </View>
  );

  const renderMediaUploader = () => (
    <View style={styles.mediaContainer}>
      <TouchableOpacity style={styles.uploadArea} activeOpacity={0.7}>
        <Text style={styles.uploadIcon}>📁</Text>
        <Text style={styles.uploadText}>
          {postType === "image" ? "Upload Image" : "Upload Video"}
        </Text>
        <Text style={styles.uploadSubtext}>
          Tap to select from gallery or take a new {postType}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.mediaTitleInput}
        placeholder="Add a caption..."
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
        maxLength={150}
      />

      <TextInput
        style={styles.tagsInput}
        placeholder="Add tags (separated by commas)..."
        placeholderTextColor="#9ca3af"
        value={tags}
        onChangeText={setTags}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Post Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, postType === "text" && styles.activeType]}
          onPress={() => handlePostTypeChange("text")}
        >
          <Text
            style={[
              styles.typeText,
              postType === "text" && styles.activeTypeText,
            ]}
          >
            ✍️ Text
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, postType === "image" && styles.activeType]}
          onPress={() => handlePostTypeChange("image")}
        >
          <Text
            style={[
              styles.typeText,
              postType === "image" && styles.activeTypeText,
            ]}
          >
            📷 Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, postType === "video" && styles.activeType]}
          onPress={() => handlePostTypeChange("video")}
        >
          <Text
            style={[
              styles.typeText,
              postType === "video" && styles.activeTypeText,
            ]}
          >
            🎥 Video
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Editor */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {postType === "text" ? renderTextEditor() : renderMediaUploader()}

        {/* Preview Section */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewPostTitle}>
              {title || "Your post title will appear here"}
            </Text>
            <Text style={styles.previewContent}>
              {content || "Your content will appear here"}
            </Text>
            {tags && <Text style={styles.previewTags}>Tags: {tags}</Text>}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.draftButton}
          onPress={handleSaveDraft}
          disabled={isCreatingPost}
        >
          <Text style={styles.draftText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.publishButton,
            isCreatingPost && styles.disabledButton,
          ]}
          onPress={handlePublish}
          disabled={isCreatingPost}
        >
          {isCreatingPost ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <TabNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSpacer: {
    width: 60,
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeType: {
    backgroundColor: "#6366f1",
  },
  typeText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTypeText: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  editorContainer: {
    marginBottom: 20,
  },
  titleInput: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 16,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  contentInput: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    height: 200,
    marginBottom: 16,
  },
  tagsInput: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 16,
    color: "#ffffff",
    fontSize: 14,
  },
  mediaContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  uploadArea: {
    width: "100%",
    height: 200,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#374151",
    borderStyle: "dashed",
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  mediaTitleInput: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    width: "100%",
    marginBottom: 16,
  },
  previewContainer: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
  },
  previewPostTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
    marginBottom: 8,
  },
  previewTags: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  draftButton: {
    backgroundColor: "#374151",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  draftText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
  },
  publishButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  publishText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateSubScreen;
