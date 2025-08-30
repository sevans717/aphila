/**
 * Formatting Utilities
 * Text formatting, date formatting, number formatting, and display utilities
 */

export interface FormatOptions {
  locale?: string;
  timezone?: string;
  currency?: string;
}

export interface DateFormatOptions {
  format?: "short" | "medium" | "long" | "full" | "relative" | "custom";
  customFormat?: string;
  showTime?: boolean;
  relative?: boolean;
}

export interface NumberFormatOptions {
  decimals?: number;
  thousands?: boolean;
  currency?: string;
  percentage?: boolean;
  compact?: boolean;
}

class FormattingService {
  private defaultLocale = "en-US";
  private defaultTimezone = "UTC";
  private defaultCurrency = "USD";

  /**
   * Format date/time values
   */
  public formatDate(
    date: Date | string | number,
    options: DateFormatOptions = {},
    locale: string = this.defaultLocale
  ): string {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const {
      format = "medium",
      customFormat,
      showTime = false,
      relative = false,
    } = options;

    // Relative formatting (e.g., "2 hours ago")
    if (relative || format === "relative") {
      return this.formatRelativeTime(dateObj, locale);
    }

    // Custom format
    if (customFormat) {
      return this.formatCustomDate(dateObj, customFormat);
    }

    // Standard formats
    const formatOptions: Intl.DateTimeFormatOptions = {};

    switch (format) {
      case "short":
        formatOptions.dateStyle = "short";
        break;
      case "medium":
        formatOptions.dateStyle = "medium";
        break;
      case "long":
        formatOptions.dateStyle = "long";
        break;
      case "full":
        formatOptions.dateStyle = "full";
        break;
    }

    if (showTime) {
      formatOptions.timeStyle = "short";
    }

    try {
      return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
    } catch (error) {
      console.warn("Date formatting error:", error);
      return dateObj.toLocaleDateString();
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  public formatRelativeTime(
    date: Date | string | number,
    locale: string = this.defaultLocale
  ): string {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    // Less than a minute
    if (diffSeconds < 60) {
      return "Just now";
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
    }

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  }

  /**
   * Format custom date pattern
   */
  private formatCustomDate(date: Date, pattern: string): string {
    const replacements: Record<string, string> = {
      YYYY: date.getFullYear().toString(),
      YY: date.getFullYear().toString().slice(-2),
      MM: (date.getMonth() + 1).toString().padStart(2, "0"),
      M: (date.getMonth() + 1).toString(),
      DD: date.getDate().toString().padStart(2, "0"),
      D: date.getDate().toString(),
      HH: date.getHours().toString().padStart(2, "0"),
      H: date.getHours().toString(),
      mm: date.getMinutes().toString().padStart(2, "0"),
      m: date.getMinutes().toString(),
      ss: date.getSeconds().toString().padStart(2, "0"),
      s: date.getSeconds().toString(),
    };

    let formatted = pattern;
    for (const [token, replacement] of Object.entries(replacements)) {
      formatted = formatted.replace(new RegExp(token, "g"), replacement);
    }

    return formatted;
  }

  /**
   * Format numbers with various options
   */
  public formatNumber(
    value: number,
    options: NumberFormatOptions = {},
    locale: string = this.defaultLocale
  ): string {
    const {
      decimals,
      thousands = true,
      currency,
      percentage = false,
      compact = false,
    } = options;

    if (isNaN(value)) {
      return "0";
    }

    try {
      const formatOptions: Intl.NumberFormatOptions = {};

      if (currency) {
        formatOptions.style = "currency";
        formatOptions.currency = currency;
      } else if (percentage) {
        formatOptions.style = "percent";
      }

      if (decimals !== undefined) {
        formatOptions.minimumFractionDigits = decimals;
        formatOptions.maximumFractionDigits = decimals;
      }

      if (!thousands) {
        formatOptions.useGrouping = false;
      }

      if (compact) {
        formatOptions.notation = "compact";
      }

      return new Intl.NumberFormat(locale, formatOptions).format(value);
    } catch (error) {
      console.warn("Number formatting error:", error);
      return value.toString();
    }
  }

  /**
   * Format currency values
   */
  public formatCurrency(
    value: number,
    currency: string = this.defaultCurrency,
    locale: string = this.defaultLocale
  ): string {
    return this.formatNumber(value, { currency }, locale);
  }

  /**
   * Format percentage values
   */
  public formatPercentage(
    value: number,
    decimals: number = 1,
    locale: string = this.defaultLocale
  ): string {
    return this.formatNumber(value, { percentage: true, decimals }, locale);
  }

  /**
   * Format file sizes
   */
  public formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  /**
   * Format duration in milliseconds
   */
  public formatDuration(
    ms: number,
    format: "short" | "long" = "short"
  ): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return format === "short"
        ? `${days}d ${hours % 24}h`
        : `${days} day${days === 1 ? "" : "s"} ${hours % 24} hour${hours % 24 === 1 ? "" : "s"}`;
    }

    if (hours > 0) {
      return format === "short"
        ? `${hours}h ${minutes % 60}m`
        : `${hours} hour${hours === 1 ? "" : "s"} ${minutes % 60} minute${minutes % 60 === 1 ? "" : "s"}`;
    }

    if (minutes > 0) {
      return format === "short"
        ? `${minutes}m ${seconds % 60}s`
        : `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds % 60} second${seconds % 60 === 1 ? "" : "s"}`;
    }

    return format === "short"
      ? `${seconds}s`
      : `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  /**
   * Format phone numbers
   */
  public formatPhoneNumber(
    phoneNumber: string,
    format: "international" | "national" | "e164" = "national"
  ): string {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, "");

    // US phone number formatting
    if (digits.length === 10) {
      switch (format) {
        case "international":
          return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        case "national":
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        case "e164":
          return `+1${digits}`;
      }
    }

    // US phone number with country code
    if (digits.length === 11 && digits.startsWith("1")) {
      const number = digits.slice(1);
      switch (format) {
        case "international":
          return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
        case "national":
          return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
        case "e164":
          return `+${digits}`;
      }
    }

    // Return original if we can't format
    return phoneNumber;
  }

  /**
   * Truncate text with ellipsis
   */
  public truncateText(
    text: string,
    maxLength: number,
    ellipsis: string = "..."
  ): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - ellipsis.length) + ellipsis;
  }

  /**
   * Format text for display (capitalize, etc.)
   */
  public formatDisplayText(
    text: string,
    format: "title" | "sentence" | "upper" | "lower" = "title"
  ): string {
    switch (format) {
      case "title":
        return text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case "sentence":
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      case "upper":
        return text.toUpperCase();
      case "lower":
        return text.toLowerCase();
      default:
        return text;
    }
  }

  /**
   * Format username/handle
   */
  public formatUsername(username: string, includeAt: boolean = true): string {
    const clean = username.replace(/^@+/, "");
    return includeAt ? `@${clean}` : clean;
  }

  /**
   * Format address for display
   */
  public formatAddress(
    address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    },
    format: "short" | "full" = "full"
  ): string {
    const parts: string[] = [];

    if (format === "short") {
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
    } else {
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state && address.zipCode) {
        parts.push(`${address.state} ${address.zipCode}`);
      } else {
        if (address.state) parts.push(address.state);
        if (address.zipCode) parts.push(address.zipCode);
      }
      if (address.country && address.country !== "US") {
        parts.push(address.country);
      }
    }

    return parts.join(", ");
  }

  /**
   * Format distance for display
   */
  public formatDistance(
    distanceInMeters: number,
    unit: "metric" | "imperial" = "imperial"
  ): string {
    if (unit === "metric") {
      if (distanceInMeters < 1000) {
        return `${Math.round(distanceInMeters)}m`;
      }
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    } else {
      const feet = distanceInMeters * 3.28084;
      if (feet < 5280) {
        return `${Math.round(feet)}ft`;
      }
      const miles = feet / 5280;
      return `${miles.toFixed(1)}mi`;
    }
  }

  /**
   * Format list of items
   */
  public formatList(
    items: string[],
    conjunction: "and" | "or" = "and",
    locale: string = this.defaultLocale
  ): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

    try {
      return new Intl.ListFormat(locale, {
        style: "long",
        type: conjunction === "and" ? "conjunction" : "disjunction",
      }).format(items);
    } catch (error) {
      // Fallback for unsupported locales
      const last = items[items.length - 1];
      const rest = items.slice(0, -1);
      return `${rest.join(", ")}, ${conjunction} ${last}`;
    }
  }

  /**
   * Clean and format user input
   */
  public cleanInput(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[^\w\s\-_.@]/gi, ""); // Remove special chars except common ones
  }

  /**
   * Format age from birth date
   */
  public formatAge(birthDate: Date | string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Format time remaining/countdown
   */
  public formatCountdown(endTime: Date | string): string {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /**
   * Set default formatting options
   */
  public setDefaults(options: FormatOptions): void {
    if (options.locale) this.defaultLocale = options.locale;
    if (options.timezone) this.defaultTimezone = options.timezone;
    if (options.currency) this.defaultCurrency = options.currency;
  }

  /**
   * Get current defaults
   */
  public getDefaults(): FormatOptions {
    return {
      locale: this.defaultLocale,
      timezone: this.defaultTimezone,
      currency: this.defaultCurrency,
    };
  }
}

// Export singleton instance
export const formatService = new FormattingService();
export default formatService;
