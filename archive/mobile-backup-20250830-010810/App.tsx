import React from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigation from "./src/navigation/AppNavigation";

export default function App() {
  // Initialize the app
  React.useEffect(() => {
    // Any initialization logic can go here
    console.log("SAV3 Mobile App initialized");
  }, []);

  return (
    <>
      <AppNavigation />
      <StatusBar style="auto" />
    </>
  );
}
