import React from "react";
import { AppRouter } from "@/components/AppRouter";
import { DesktopStoreProvider } from "@/store";
import "@/styles/globals.css";

const App: React.FC = () => {
  return (
    <DesktopStoreProvider>
      <div className="app">
        <AppRouter />
      </div>
    </DesktopStoreProvider>
  );
};

export default App;
