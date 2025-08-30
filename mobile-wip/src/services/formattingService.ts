/**
 * Formatting Service
 * Provides utilities for formatting dates, numbers, currency, and text
 */
class FormattingService {
  private locale: string = "en-US";
  private currency: string = "USD";
  private timezone: string = "UTC";

  constructor() {
    this.initialize();
  }

  /**
   * Initialize formatting service with device settings
   */
  private initialize(): void {
    try {
      // Get device locale and timezone
      this.locale = Intl.DateTimeFormat().resolvedOptions().locale;
      this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn("Failed to initialize formatting service:", error);
    }
  }

  // Date/Time Formatting
  /**
   * Format date to readable string
   */
  formatDate(date: Date | string, formatStr: string = "MMM dd, yyyy"): string {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }

      const options: Intl.DateTimeFormatOptions = {};

      // Parse format string and map to Intl options
      if (formatStr.includes("MMM")) options.month = "short";
      else if (formatStr.includes("MM")) options.month = "2-digit";
      else if (formatStr.includes("M")) options.month = "numeric";

      if (formatStr.includes("dd")) options.day = "2-digit";
      else if (formatStr.includes("d")) options.day = "numeric";

      if (formatStr.includes("yyyy")) options.year = "numeric";
      else if (formatStr.includes("yy")) options.year = "2-digit";

      return new Intl.DateTimeFormat(this.locale, options).format(dateObj);
    } catch (error) {
      console.error("Failed to format date:", error);
      return "Invalid Date";
    }
  }

  /**
   * Format time to readable string
   */
  formatTime(date: Date | string, formatStr: string = "HH:mm"): string {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        return "Invalid Time";
      }

      const options: Intl.DateTimeFormatOptions = {
        hour12: formatStr.includes("HH") ? false : true,
      };

      if (formatStr.includes("HH") || formatStr.includes("hh"))
        options.hour = "2-digit";
      if (formatStr.includes("mm")) options.minute = "2-digit";
      if (formatStr.includes("ss")) options.second = "2-digit";

      return new Intl.DateTimeFormat(this.locale, options).format(dateObj);
    } catch (error) {
      console.error("Failed to format time:", error);
      return "Invalid Time";
    }
  }

  /**
   * Format date and time together
   */
  formatDateTime(
    date: Date | string,
    formatStr: string = "MMM dd, yyyy HH:mm"
  ): string {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        return "Invalid Date/Time";
      }

      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };

      return new Intl.DateTimeFormat(this.locale, options).format(dateObj);
    } catch (error) {
      console.error("Failed to format date time:", error);
      return "Invalid Date/Time";
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date | string, baseDate?: Date): string {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      const base = baseDate || new Date();

      if (isNaN(dateObj.getTime())) {
        return "Unknown time";
      }

      const diffMs = base.getTime() - dateObj.getTime();
      const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      const isPast = diffMs > 0;
      const suffix = isPast ? "ago" : "from now";

      if (diffSeconds < 60) return `just now`;
      if (diffMinutes < 60)
        return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ${suffix}`;
      if (diffHours < 24)
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ${suffix}`;
      if (diffDays < 7)
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ${suffix}`;

      return this.formatDate(dateObj);
    } catch (error) {
      console.error("Failed to format relative time:", error);
      return "Unknown time";
    }
  }

  /**
   * Format duration in milliseconds to human readable
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Number Formatting
  /**
   * Format number with commas and decimals
   */
  formatNumber(num: number, decimals: number = 0): string {
    try {
      return new Intl.NumberFormat(this.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    } catch (error) {
      console.error("Failed to format number:", error);
      return num.toString();
    }
  }

  /**
   * Format large numbers with K, M, B suffixes
   */
  formatCompactNumber(num: number): string {
    try {
      return new Intl.NumberFormat(this.locale, {
        notation: "compact",
        compactDisplay: "short",
      }).format(num);
    } catch (error) {
      console.error("Failed to format compact number:", error);
      return num.toString();
    }
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number, decimals: number = 1): string {
    try {
      return new Intl.NumberFormat(this.locale, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value / 100);
    } catch (error) {
      console.error("Failed to format percentage:", error);
      return `${value}%`;
    }
  }

  // Currency Formatting
  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currencyCode?: string): string {
    try {
      return new Intl.NumberFormat(this.locale, {
        style: "currency",
        currency: currencyCode || this.currency,
      }).format(amount);
    } catch (error) {
      console.error("Failed to format currency:", error);
      return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Format currency without symbol
   */
  formatCurrencyValue(amount: number, currencyCode?: string): string {
    try {
      return new Intl.NumberFormat(this.locale, {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error("Failed to format currency value:", error);
      return amount.toFixed(2);
    }
  }

  // Text Formatting
  /**
   * Capitalize first letter of string
   */
  capitalize(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Capitalize first letter of each word
   */
  titleCase(text: string): string {
    if (!text) return text;
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Truncate text to specified length
   */
  truncate(text: string, maxLength: number, suffix: string = "..."): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format phone number
   */
  formatPhoneNumber(phone: string): string {
    try {
      // Remove all non-digit characters
      const cleaned = phone.replace(/\D/g, "");

      // Format based on length
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }

      return phone; // Return original if can't format
    } catch (error) {
      console.error("Failed to format phone number:", error);
      return phone;
    }
  }

  /**
   * Format address
   */
  formatAddress(address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Format list with proper grammar
   */
  formatList(items: string[], conjunction: string = "and"): string {
    if (!items || items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

    const allButLast = items.slice(0, -1).join(", ");
    const last = items[items.length - 1];
    return `${allButLast}, ${conjunction} ${last}`;
  }

  // Configuration
  /**
   * Update locale
   */
  setLocale(locale: string): void {
    this.locale = locale;
  }

  /**
   * Update currency
   */
  setCurrency(currency: string): void {
    this.currency = currency;
  }

  /**
   * Update timezone
   */
  setTimezone(timezone: string): void {
    this.timezone = timezone;
  }

  /**
   * Get current locale
   */
  getLocale(): string {
    return this.locale;
  }

  /**
   * Get current currency
   */
  getCurrency(): string {
    return this.currency;
  }

  /**
   * Get current timezone
   */
  getTimezone(): string {
    return this.timezone;
  }
}

export const formattingService = new FormattingService();
