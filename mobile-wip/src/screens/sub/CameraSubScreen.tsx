import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMediaStore } from "../../stores/modules/mediaStore";
import TabNavBar from "../../components/navigation/TabNavBar";

const CameraSubScreen: React.FC = () => {
  const navigation = useNavigation();

  // Media store hooks
  const {
    cameraSettings,
    isRecording,
    recordingDuration,
    captureMode,
    updateCameraSettings,
    setCaptureMode,
    startRecording,
    stopRecording,
    capturePhoto,
  } = useMediaStore();

  const handleCapture = () => {
    const capturedItem = capturePhoto();
    Alert.alert("Photo Captured", `Photo saved with ID: ${capturedItem.id}`);
  };

  const handleRecord = () => {
    if (isRecording) {
      const recordedItem = stopRecording();
      Alert.alert(
        "Recording Stopped",
        `Video saved with ID: ${recordedItem.id}`
      );
    } else {
      startRecording();
      Alert.alert("Recording Started", "Tap stop to end recording");
    }
  };

  const handleSwitchCamera = () => {
    // Toggle between front and back camera (mock implementation)
    Alert.alert("Camera", "Switched camera");
  };

  const handleFlash = () => {
    const newFlashMode = cameraSettings.flashMode === "on" ? "off" : "on";
    updateCameraSettings({ flashMode: newFlashMode });
    Alert.alert("Flash", `Flash ${newFlashMode}`);
  };

  const handleTimer = () => {
    const newTimer =
      cameraSettings.timer === 0 ? 3 : cameraSettings.timer === 3 ? 10 : 0;
    updateCameraSettings({ timer: newTimer });
    Alert.alert("Timer", `Timer set to ${newTimer} seconds`);
  };

  const handleGrid = () => {
    const newGridLines = !cameraSettings.gridLines;
    updateCameraSettings({ gridLines: newGridLines });
    Alert.alert("Grid", `Grid ${newGridLines ? "enabled" : "disabled"}`);
  };

  const handleModeSwitch = () => {
    const newMode =
      captureMode === "photo"
        ? "video"
        : captureMode === "video"
          ? "story"
          : "photo";
    setCaptureMode(newMode);
    Alert.alert("Mode", `Switched to ${newMode} mode`);
  };

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
        <Text style={styles.headerTitle}>Camera</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View (Mock) */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraView}>
          <Text style={styles.cameraPlaceholder}>📷 Camera View</Text>
          <Text style={styles.cameraText}>Mock Camera Interface</Text>
          <Text style={styles.cameraMode}>{captureMode.toUpperCase()}</Text>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <Text style={styles.recordingText}>REC {recordingDuration}s</Text>
            </View>
          )}
        </View>

        {/* Camera Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={handleFlash}>
            <Text style={styles.controlText}>
              {cameraSettings.flashMode === "on" ? "⚡" : "⚡❌"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={captureMode === "photo" ? handleCapture : handleRecord}
          >
            <Text style={styles.captureText}>
              {captureMode === "photo" ? "📸" : isRecording ? "⏹️" : "⏺️"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSwitchCamera}
          >
            <Text style={styles.controlText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Switch */}
        <TouchableOpacity style={styles.modeButton} onPress={handleModeSwitch}>
          <Text style={styles.modeText}>
            {captureMode === "photo"
              ? "📹"
              : captureMode === "video"
                ? "📖"
                : "📸"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            cameraSettings.gridLines && styles.optionActive,
          ]}
          onPress={handleGrid}
        >
          <Text style={styles.optionText}>Grid</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            cameraSettings.timer > 0 && styles.optionActive,
          ]}
          onPress={handleTimer}
        >
          <Text style={styles.optionText}>
            Timer{cameraSettings.timer > 0 ? ` ${cameraSettings.timer}s` : ""}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Filters</Text>
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
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraView: {
    width: "90%",
    height: "60%",
    backgroundColor: "#1f2937",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  cameraPlaceholder: {
    fontSize: 48,
    marginBottom: 10,
  },
  cameraText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: {
    fontSize: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#6366f1",
  },
  captureText: {
    fontSize: 24,
  },
  recordButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 20,
  },
  recording: {
    backgroundColor: "#7f1d1d",
  },
  recordText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  optionButton: {
    backgroundColor: "#1f2937",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  optionText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  cameraMode: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: "bold",
  },
  recordingIndicator: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  modeButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
  },
  modeText: {
    fontSize: 20,
  },
  optionActive: {
    backgroundColor: "#6366f1",
  },
});

export default CameraSubScreen;
