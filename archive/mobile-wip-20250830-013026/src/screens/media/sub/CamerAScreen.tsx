import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const CamerAScreen: React.FC = () => {
  const navigation = useNavigation();
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [flashMode, setFlashMode] = useState<"off" | "on" | "auto">("off");

  const handleCapture = () => {
    // Mock capture functionality
    console.log(`Capturing ${cameraMode}`);
  };

  const handleSwitchCamera = () => {
    console.log("Switching camera");
  };

  const handleFlashToggle = () => {
    const modes: ("off" | "on" | "auto")[] = ["off", "on", "auto"];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };

  return (
    <View style={styles.container}>
      {/* Camera View Placeholder */}
      <View style={styles.cameraView}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Camera View</Text>
          <Text style={styles.cameraSubtext}>
            {cameraMode === "photo"
              ? "Ready to capture photo"
              : "Ready to record video"}
          </Text>
        </View>
      </View>

      {/* Camera Controls */}
      <View style={styles.controlsContainer}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlText}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleFlashToggle}
          >
            <Text style={styles.controlText}>
              {flashMode === "off" ? "⚡" : flashMode === "on" ? "⚡" : "🔄"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Mode Toggle */}
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                cameraMode === "photo" && styles.activeMode,
              ]}
              onPress={() => setCameraMode("photo")}
            >
              <Text
                style={[
                  styles.modeText,
                  cameraMode === "photo" && styles.activeModeText,
                ]}
              >
                Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                cameraMode === "video" && styles.activeMode,
              ]}
              onPress={() => setCameraMode("video")}
            >
              <Text
                style={[
                  styles.modeText,
                  cameraMode === "video" && styles.activeModeText,
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Capture Button */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner}>
              {cameraMode === "video" && (
                <View style={styles.recordIndicator}>
                  <Text style={styles.recordDot}>●</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Switch Camera */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchCamera}
          >
            <Text style={styles.switchText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Features */}
      <View style={styles.featuresContainer}>
        <TouchableOpacity style={styles.featureButton}>
          <Text style={styles.featureText}>🎨 Filters</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton}>
          <Text style={styles.featureText}>⏱️ Timer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton}>
          <Text style={styles.featureText}>📐 Grid</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton}>
          <Text style={styles.featureText}>💡 HDR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraView: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholder: {
    alignItems: "center",
  },
  cameraIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  cameraText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  cameraSubtext: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
  controlsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: {
    fontSize: 20,
    color: "#fff",
  },
  bottomControls: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modeContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  activeMode: {
    backgroundColor: "#fff",
  },
  modeText: {
    fontSize: 16,
    color: "#ccc",
    fontWeight: "500",
  },
  activeModeText: {
    color: "#000",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  recordIndicator: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
  },
  recordDot: {
    color: "#fff",
    fontSize: 12,
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: {
    fontSize: 20,
  },
  featuresContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  featureButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  featureText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default CamerAScreen;
