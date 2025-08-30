/**
 * Simple Theme Configuration for React Navigation
 * Basic colors, typography, and spacing for navigation components
 */

export interface SimpleTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    border: string;
    placeholder: string;
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    fonts: {
      regular: string;
      medium: string;
      bold: string;
      light: string;
    };
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  animation: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  navigation: {
    dark: boolean;
    colors: {
      primary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;
    };
  };
}

export const lightTheme: SimpleTheme = {
  colors: {
    primary: "#007AFF",
    secondary: "#5856D6",
    accent: "#FF9500",
    background: "#FFFFFF",
    surface: "#F2F2F7",
    error: "#FF3B30",
    warning: "#FF9500",
    success: "#34C759",
    info: "#007AFF",
    text: {
      primary: "#000000",
      secondary: "#8E8E93",
      disabled: "#C7C7CC",
      inverse: "#FFFFFF",
    },
    border: "#C6C6C8",
    placeholder: "#C7C7CD",
    shadow: "#000000",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fonts: {
      regular: "System",
      medium: "System-Medium",
      bold: "System-Bold",
      light: "System-Light",
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  shadows: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: "linear",
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
    },
  },
  navigation: {
    dark: false,
    colors: {
      primary: "#007AFF",
      background: "#FFFFFF",
      card: "#FFFFFF",
      text: "#000000",
      border: "#C6C6C8",
      notification: "#FF3B30",
    },
  },
};

export const darkTheme: SimpleTheme = {
  ...lightTheme,
  colors: {
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    accent: "#FF9F0A",
    background: "#000000",
    surface: "#1C1C1E",
    error: "#FF453A",
    warning: "#FF9F0A",
    success: "#30D158",
    info: "#64D2FF",
    text: {
      primary: "#FFFFFF",
      secondary: "#8E8E93",
      disabled: "#48484A",
      inverse: "#000000",
    },
    border: "#38383A",
    placeholder: "#48484A",
    shadow: "#000000",
  },
  navigation: {
    dark: true,
    colors: {
      primary: "#0A84FF",
      background: "#000000",
      card: "#1C1C1E",
      text: "#FFFFFF",
      border: "#38383A",
      notification: "#FF453A",
    },
  },
};

// Export default theme (can be switched based on user preference)
export const theme = lightTheme;
export default theme;
