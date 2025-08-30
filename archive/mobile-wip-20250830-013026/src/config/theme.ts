/**
 * Theme Configuration
 * Defines visual themes, colors, typography, spacing, and component styling
 */

// Theme Configuration
export interface ThemeConfig {
  current: ThemeName;
  available: ThemeDefinition[];
  system: SystemThemeConfig;
  customization: ThemeCustomizationConfig;
  transitions: ThemeTransitionConfig;
  persistence: ThemePersistenceConfig;
}

export type ThemeName =
  | "light"
  | "dark"
  | "auto"
  | "high_contrast"
  | "custom"
  | string;

// Theme Definition
export interface ThemeDefinition {
  name: ThemeName;
  displayName: string;
  description?: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  shadows: ShadowConfig;
  borders: BorderConfig;
  animations: AnimationConfig;
  components: ComponentThemeConfig;
  accessibility: AccessibilityThemeConfig;
  metadata: ThemeMetadata;
}

// Color System
export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  tertiary: ColorScale;
  neutral: ColorScale;
  semantic: SemanticColors;
  gradients: GradientCollection;
  overlays: OverlayColors;
  surfaces: SurfaceColors;
  interactive: InteractiveColors;
  brand: BrandColors;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // base color
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SemanticColors {
  success: ColorVariants;
  warning: ColorVariants;
  error: ColorVariants;
  info: ColorVariants;
  accent: ColorVariants;
}

export interface ColorVariants {
  light: string;
  main: string;
  dark: string;
  contrast: string;
}

export interface GradientCollection {
  primary: GradientDefinition;
  secondary: GradientDefinition;
  accent: GradientDefinition;
  success: GradientDefinition;
  warning: GradientDefinition;
  error: GradientDefinition;
  custom: Record<string, GradientDefinition>;
}

export interface GradientDefinition {
  type: "linear" | "radial" | "conic";
  colors: string[];
  stops?: number[];
  angle?: number; // degrees for linear
  position?: string; // for radial/conic
}

export interface OverlayColors {
  backdrop: string;
  modal: string;
  tooltip: string;
  dropdown: string;
  scrim: string;
}

export interface SurfaceColors {
  background: string;
  surface: string;
  card: string;
  sheet: string;
  elevated: string;
  sunken: string;
}

export interface InteractiveColors {
  hover: string;
  pressed: string;
  focused: string;
  selected: string;
  disabled: string;
  loading: string;
}

export interface BrandColors {
  logo: string;
  accent: string;
  highlight: string;
  muted: string;
}

// Typography System
export interface TypographyConfig {
  fonts: FontFamily[];
  scales: TypographyScale[];
  weights: FontWeightConfig;
  lineHeights: LineHeightConfig;
  letterSpacing: LetterSpacingConfig;
  textStyles: TextStyleCollection;
}

export interface FontFamily {
  name: string;
  fallback: string[];
  weights: number[];
  italics: boolean;
  variable: boolean;
  source: FontSource;
}

export interface FontSource {
  type: "system" | "web" | "local" | "cdn";
  url?: string;
  files?: FontFile[];
  display?: "auto" | "block" | "swap" | "fallback" | "optional";
}

export interface FontFile {
  weight: number;
  style: "normal" | "italic";
  format: "woff2" | "woff" | "ttf" | "otf";
  url: string;
}

export interface TypographyScale {
  name: string;
  base: number; // rem
  ratio: number;
  steps: TypographyStep[];
}

export interface TypographyStep {
  name: string;
  size: number; // rem
  lineHeight: number;
  letterSpacing: number;
  weight?: number;
  usage: string;
}

export interface FontWeightConfig {
  thin: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
  black: number;
}

export interface LineHeightConfig {
  none: number;
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface LetterSpacingConfig {
  tighter: number;
  tight: number;
  normal: number;
  wide: number;
  wider: number;
  widest: number;
}

export interface TextStyleCollection {
  heading: HeadingStyles;
  body: BodyStyles;
  caption: CaptionStyles;
  display: DisplayStyles;
  code: CodeStyles;
  ui: UIStyles;
}

export interface HeadingStyles {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  h6: TextStyle;
}

export interface BodyStyles {
  large: TextStyle;
  medium: TextStyle;
  small: TextStyle;
  tiny: TextStyle;
}

export interface CaptionStyles {
  large: TextStyle;
  medium: TextStyle;
  small: TextStyle;
}

export interface DisplayStyles {
  large: TextStyle;
  medium: TextStyle;
  small: TextStyle;
}

export interface CodeStyles {
  inline: TextStyle;
  block: TextStyle;
  console: TextStyle;
}

export interface UIStyles {
  button: TextStyle;
  link: TextStyle;
  label: TextStyle;
  input: TextStyle;
  placeholder: TextStyle;
}

export interface TextStyle {
  fontSize: number; // rem
  lineHeight: number;
  fontWeight: number;
  letterSpacing: number;
  fontFamily: string;
  color?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";
}

// Spacing System
export interface SpacingConfig {
  unit: number; // base spacing unit in px
  scale: SpacingScale;
  semantic: SemanticSpacing;
  component: ComponentSpacing;
  responsive: ResponsiveSpacing;
}

export interface SpacingScale {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  8: number;
  10: number;
  12: number;
  16: number;
  20: number;
  24: number;
  32: number;
  40: number;
  48: number;
  56: number;
  64: number;
  80: number;
  96: number;
  112: number;
  128: number;
}

export interface SemanticSpacing {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
  "4xl": number;
}

export interface ComponentSpacing {
  button: ComponentSpacingValues;
  input: ComponentSpacingValues;
  card: ComponentSpacingValues;
  modal: ComponentSpacingValues;
  list: ComponentSpacingValues;
  navigation: ComponentSpacingValues;
}

export interface ComponentSpacingValues {
  padding: {
    x: number;
    y: number;
  };
  margin: {
    x: number;
    y: number;
  };
  gap: number;
}

export interface ResponsiveSpacing {
  mobile: SpacingModifiers;
  tablet: SpacingModifiers;
  desktop: SpacingModifiers;
  wide: SpacingModifiers;
}

export interface SpacingModifiers {
  multiplier: number;
  adjustments: Record<string, number>;
}

// Shadow System
export interface ShadowConfig {
  elevation: ElevationShadows;
  semantic: SemanticShadows;
  interactive: InteractiveShadows;
  custom: Record<string, ShadowDefinition>;
}

export interface ElevationShadows {
  0: ShadowDefinition;
  1: ShadowDefinition;
  2: ShadowDefinition;
  3: ShadowDefinition;
  4: ShadowDefinition;
  5: ShadowDefinition;
  6: ShadowDefinition;
  7: ShadowDefinition;
  8: ShadowDefinition;
}

export interface SemanticShadows {
  card: ShadowDefinition;
  modal: ShadowDefinition;
  dropdown: ShadowDefinition;
  tooltip: ShadowDefinition;
  floating: ShadowDefinition;
}

export interface InteractiveShadows {
  hover: ShadowDefinition;
  pressed: ShadowDefinition;
  focused: ShadowDefinition;
  dragged: ShadowDefinition;
}

export interface ShadowDefinition {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

// Border System
export interface BorderConfig {
  radius: BorderRadiusConfig;
  width: BorderWidthConfig;
  style: BorderStyleConfig;
  colors: BorderColorConfig;
  semantic: SemanticBorders;
}

export interface BorderRadiusConfig {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
  full: number;
}

export interface BorderWidthConfig {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  8: number;
}

export interface BorderStyleConfig {
  solid: string;
  dashed: string;
  dotted: string;
  double: string;
  none: string;
}

export interface BorderColorConfig {
  default: string;
  muted: string;
  emphasis: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
}

export interface SemanticBorders {
  input: BorderDefinition;
  card: BorderDefinition;
  button: BorderDefinition;
  divider: BorderDefinition;
  focus: BorderDefinition;
}

export interface BorderDefinition {
  width: number;
  style: string;
  color: string;
  radius?: number;
}

// Animation System
export interface AnimationConfig {
  durations: AnimationDurations;
  easings: AnimationEasings;
  transitions: TransitionCollection;
  keyframes: KeyframeCollection;
  preferences: AnimationPreferences;
}

export interface AnimationDurations {
  instant: number;
  fast: number;
  normal: number;
  slow: number;
  slower: number;
}

export interface AnimationEasings {
  linear: string;
  ease: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  spring: string;
  bounce: string;
  custom: Record<string, string>;
}

export interface TransitionCollection {
  fade: TransitionDefinition;
  slide: TransitionDefinition;
  scale: TransitionDefinition;
  rotate: TransitionDefinition;
  bounce: TransitionDefinition;
  flip: TransitionDefinition;
  custom: Record<string, TransitionDefinition>;
}

export interface TransitionDefinition {
  property: string;
  duration: number;
  easing: string;
  delay?: number;
}

export interface KeyframeCollection {
  pulse: KeyframeDefinition;
  spin: KeyframeDefinition;
  ping: KeyframeDefinition;
  bounce: KeyframeDefinition;
  shake: KeyframeDefinition;
  wiggle: KeyframeDefinition;
  custom: Record<string, KeyframeDefinition>;
}

export interface KeyframeDefinition {
  name: string;
  duration: number;
  iteration: number | "infinite";
  direction: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fillMode: "none" | "forwards" | "backwards" | "both";
  keyframes: Record<string, Record<string, string>>;
}

export interface AnimationPreferences {
  respectMotionPreferences: boolean;
  fallbackDuration: number;
  debugMode: boolean;
}

// Component Theme Configuration
export interface ComponentThemeConfig {
  button: ButtonTheme;
  input: InputTheme;
  card: CardTheme;
  modal: ModalTheme;
  navigation: NavigationTheme;
  list: ListTheme;
  avatar: AvatarTheme;
  badge: BadgeTheme;
  tooltip: TooltipTheme;
  alert: AlertTheme;
  custom: Record<string, ComponentTheme>;
}

export interface ComponentTheme {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  typography: Record<string, TextStyle>;
  borders: Record<string, BorderDefinition>;
  shadows: Record<string, ShadowDefinition>;
  animations: Record<string, TransitionDefinition>;
  variants: Record<string, ComponentVariant>;
}

export interface ComponentVariant {
  name: string;
  overrides: Partial<ComponentTheme>;
  conditions?: VariantCondition[];
}

export interface VariantCondition {
  prop: string;
  value: any;
  operator?: "equals" | "not_equals" | "in" | "not_in";
}

export interface ButtonTheme extends ComponentTheme {
  variants: {
    primary: ComponentVariant;
    secondary: ComponentVariant;
    tertiary: ComponentVariant;
    ghost: ComponentVariant;
    link: ComponentVariant;
    destructive: ComponentVariant;
  };
  sizes: {
    sm: ComponentVariant;
    md: ComponentVariant;
    lg: ComponentVariant;
    xl: ComponentVariant;
  };
  states: {
    default: ComponentVariant;
    hover: ComponentVariant;
    pressed: ComponentVariant;
    focused: ComponentVariant;
    disabled: ComponentVariant;
    loading: ComponentVariant;
  };
}

export interface InputTheme extends ComponentTheme {
  variants: {
    default: ComponentVariant;
    filled: ComponentVariant;
    outline: ComponentVariant;
    underline: ComponentVariant;
    ghost: ComponentVariant;
  };
  sizes: {
    sm: ComponentVariant;
    md: ComponentVariant;
    lg: ComponentVariant;
  };
  states: {
    default: ComponentVariant;
    focused: ComponentVariant;
    error: ComponentVariant;
    disabled: ComponentVariant;
    readonly: ComponentVariant;
  };
}

export interface CardTheme extends ComponentTheme {
  variants: {
    default: ComponentVariant;
    outlined: ComponentVariant;
    filled: ComponentVariant;
    elevated: ComponentVariant;
    flat: ComponentVariant;
  };
  sizes: {
    sm: ComponentVariant;
    md: ComponentVariant;
    lg: ComponentVariant;
    full: ComponentVariant;
  };
}

export interface ModalTheme extends ComponentTheme {
  variants: {
    default: ComponentVariant;
    fullscreen: ComponentVariant;
    drawer: ComponentVariant;
    popup: ComponentVariant;
  };
  positions: {
    center: ComponentVariant;
    top: ComponentVariant;
    bottom: ComponentVariant;
    left: ComponentVariant;
    right: ComponentVariant;
  };
}

export interface NavigationTheme extends ComponentTheme {
  variants: {
    primary: ComponentVariant;
    secondary: ComponentVariant;
    minimal: ComponentVariant;
    floating: ComponentVariant;
  };
  positions: {
    top: ComponentVariant;
    bottom: ComponentVariant;
    left: ComponentVariant;
    right: ComponentVariant;
  };
}

export interface ListTheme extends ComponentTheme {
  variants: {
    default: ComponentVariant;
    divided: ComponentVariant;
    bordered: ComponentVariant;
    card: ComponentVariant;
  };
  densities: {
    compact: ComponentVariant;
    normal: ComponentVariant;
    comfortable: ComponentVariant;
  };
}

export interface AvatarTheme extends ComponentTheme {
  sizes: {
    xs: ComponentVariant;
    sm: ComponentVariant;
    md: ComponentVariant;
    lg: ComponentVariant;
    xl: ComponentVariant;
    "2xl": ComponentVariant;
  };
  variants: {
    circular: ComponentVariant;
    rounded: ComponentVariant;
    square: ComponentVariant;
  };
}

export interface BadgeTheme extends ComponentTheme {
  variants: {
    default: ComponentVariant;
    secondary: ComponentVariant;
    success: ComponentVariant;
    warning: ComponentVariant;
    error: ComponentVariant;
    info: ComponentVariant;
  };
  sizes: {
    sm: ComponentVariant;
    md: ComponentVariant;
    lg: ComponentVariant;
  };
}

export interface TooltipTheme extends ComponentTheme {
  variants: {
    default: ComponentVariant;
    dark: ComponentVariant;
    light: ComponentVariant;
    error: ComponentVariant;
    warning: ComponentVariant;
    info: ComponentVariant;
  };
  positions: {
    top: ComponentVariant;
    bottom: ComponentVariant;
    left: ComponentVariant;
    right: ComponentVariant;
  };
}

export interface AlertTheme extends ComponentTheme {
  variants: {
    info: ComponentVariant;
    success: ComponentVariant;
    warning: ComponentVariant;
    error: ComponentVariant;
    neutral: ComponentVariant;
  };
  styles: {
    filled: ComponentVariant;
    outlined: ComponentVariant;
    text: ComponentVariant;
    minimal: ComponentVariant;
  };
}

// Accessibility Theme Configuration
export interface AccessibilityThemeConfig {
  contrast: ContrastConfig;
  focusIndicators: FocusIndicatorConfig;
  colorBlind: ColorBlindConfig;
  motion: MotionConfig;
  text: AccessibleTextConfig;
}

export interface ContrastConfig {
  minimum: number; // WCAG AA minimum (4.5:1)
  enhanced: number; // WCAG AAA enhanced (7:1)
  mode: "auto" | "minimum" | "enhanced";
  overrides: Record<string, number>;
}

export interface FocusIndicatorConfig {
  width: number;
  color: string;
  style: string;
  offset: number;
  visible: "auto" | "always" | "keyboard_only";
}

export interface ColorBlindConfig {
  simulation: boolean;
  types: ColorBlindType[];
  alternativeIndicators: boolean;
  patterns: boolean;
}

export type ColorBlindType =
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia";

export interface MotionConfig {
  respectPreferences: boolean;
  reducedMotion: MotionReduction;
  alternatives: MotionAlternatives;
}

export interface MotionReduction {
  animations: "none" | "essential" | "reduced";
  transitions: "none" | "instant" | "reduced";
  parallax: boolean;
  autoplay: boolean;
}

export interface MotionAlternatives {
  crossFade: boolean;
  dissolve: boolean;
  slideReplace: boolean;
}

export interface AccessibleTextConfig {
  minSize: number; // rem
  maxSize: number; // rem
  scalingFactor: number;
  lineHeightMin: number;
  paragraphSpacing: number;
}

// System Theme Configuration
export interface SystemThemeConfig {
  detection: boolean;
  sync: boolean;
  override: boolean;
  fallback: ThemeName;
  listeners: boolean;
}

// Theme Customization
export interface ThemeCustomizationConfig {
  enabled: boolean;
  components: string[]; // which components can be customized
  properties: string[]; // which properties can be customized
  presets: CustomThemePreset[];
  export: boolean;
  import: boolean;
  reset: boolean;
}

export interface CustomThemePreset {
  name: string;
  description?: string;
  thumbnail?: string;
  config: Partial<ThemeDefinition>;
  readonly: boolean;
}

// Theme Transitions
export interface ThemeTransitionConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  properties: string[];
  stagger: boolean;
  staggerDelay: number;
}

// Theme Persistence
export interface ThemePersistenceConfig {
  enabled: boolean;
  storage: "local" | "secure" | "cloud";
  key: string;
  sync: boolean;
  compression: boolean;
  encryption: boolean;
}

// Theme Metadata
export interface ThemeMetadata {
  version: string;
  author?: string;
  created: string;
  updated: string;
  tags: string[];
  category: string;
  compatibility: string[];
  preview?: string;
  description?: string;
  license?: string;
}

// Theme Provider Interface
export interface ThemeProvider {
  getCurrentTheme(): ThemeDefinition;
  setTheme(theme: ThemeName): void;
  getAvailableThemes(): ThemeDefinition[];
  createCustomTheme(config: Partial<ThemeDefinition>): ThemeDefinition;
  deleteCustomTheme(name: string): void;
  exportTheme(name: string): string;
  importTheme(config: string): ThemeDefinition;
  subscribe(callback: (theme: ThemeDefinition) => void): () => void;
}

// Theme Context
export interface ThemeContext {
  theme: ThemeDefinition;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
  customThemes: ThemeDefinition[];
  createCustomTheme: (config: Partial<ThemeDefinition>) => void;
  deleteCustomTheme: (name: string) => void;
}

export default ThemeConfig;
