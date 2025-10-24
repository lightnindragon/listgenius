/**
 * Mobile Optimization Utilities
 */

export interface MobileBreakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export const MOBILE_BREAKPOINTS: MobileBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINTS.md;
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= MOBILE_BREAKPOINTS.md && width < MOBILE_BREAKPOINTS.lg;
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= MOBILE_BREAKPOINTS.lg;
}

/**
 * Get responsive grid columns based on screen size
 */
export function getResponsiveColumns(): number {
  if (typeof window === 'undefined') return 3;
  
  if (isMobile()) return 1;
  if (isTablet()) return 2;
  return 3;
}

/**
 * Get responsive table columns based on screen size
 */
export function getResponsiveTableColumns(): number {
  if (typeof window === 'undefined') return 5;
  
  if (isMobile()) return 2;
  if (isTablet()) return 3;
  return 5;
}

/**
 * Touch-friendly button size
 */
export function getTouchButtonSize(): string {
  if (isMobile()) return '44px'; // Minimum touch target size
  return '36px';
}

/**
 * Responsive font size
 */
export function getResponsiveFontSize(baseSize: number): number {
  if (isMobile()) return Math.max(baseSize * 0.9, 14); // Slightly smaller on mobile
  return baseSize;
}

/**
 * Responsive spacing
 */
export function getResponsiveSpacing(baseSpacing: number): number {
  if (isMobile()) return Math.max(baseSpacing * 0.8, 8); // Tighter spacing on mobile
  return baseSpacing;
}

/**
 * Mobile-optimized table configuration
 */
export function getMobileTableConfig() {
  return {
    columns: getResponsiveTableColumns(),
    showPagination: isMobile(),
    pageSize: isMobile() ? 10 : 20,
    showPageSizeSelector: !isMobile(),
    showColumnSelector: !isMobile(),
  };
}

/**
 * Mobile-optimized modal configuration
 */
export function getMobileModalConfig() {
  return {
    fullScreen: isMobile(),
    closeOnOverlayClick: !isMobile(),
    showCloseButton: true,
    padding: isMobile() ? '16px' : '24px',
  };
}

/**
 * Mobile-optimized form configuration
 */
export function getMobileFormConfig() {
  return {
    singleColumn: isMobile(),
    labelPosition: isMobile() ? 'top' : 'left',
    buttonSize: isMobile() ? 'lg' : 'md',
    inputSize: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized navigation configuration
 */
export function getMobileNavigationConfig() {
  return {
    showLabels: !isMobile(),
    iconSize: isMobile() ? 'lg' : 'md',
    spacing: isMobile() ? 'compact' : 'normal',
  };
}

/**
 * Mobile-optimized chart configuration
 */
export function getMobileChartConfig() {
  return {
    height: isMobile() ? 200 : 300,
    showLegend: !isMobile(),
    showTooltip: true,
    responsive: true,
  };
}

/**
 * Mobile-optimized data table configuration
 */
export function getMobileDataTableConfig() {
  return {
    striped: !isMobile(),
    hoverable: !isMobile(),
    compact: isMobile(),
    bordered: isMobile(),
    showHeader: true,
    showFooter: !isMobile(),
  };
}

/**
 * Mobile-optimized card configuration
 */
export function getMobileCardConfig() {
  return {
    padding: isMobile() ? '16px' : '24px',
    margin: isMobile() ? '8px' : '16px',
    shadow: isMobile() ? 'sm' : 'md',
    rounded: isMobile() ? 'md' : 'lg',
  };
}

/**
 * Mobile-optimized button configuration
 */
export function getMobileButtonConfig() {
  return {
    size: isMobile() ? 'lg' : 'md',
    fullWidth: isMobile(),
    spacing: isMobile() ? 'compact' : 'normal',
  };
}

/**
 * Mobile-optimized input configuration
 */
export function getMobileInputConfig() {
  return {
    size: isMobile() ? 'lg' : 'md',
    fullWidth: isMobile(),
    showLabel: true,
    labelPosition: isMobile() ? 'top' : 'left',
  };
}

/**
 * Mobile-optimized select configuration
 */
export function getMobileSelectConfig() {
  return {
    size: isMobile() ? 'lg' : 'md',
    fullWidth: isMobile(),
    showSearch: !isMobile(),
    maxHeight: isMobile() ? '200px' : '300px',
  };
}

/**
 * Mobile-optimized textarea configuration
 */
export function getMobileTextareaConfig() {
  return {
    rows: isMobile() ? 4 : 6,
    fullWidth: isMobile(),
    resize: isMobile() ? 'vertical' : 'both',
  };
}

/**
 * Mobile-optimized tooltip configuration
 */
export function getMobileTooltipConfig() {
  return {
    show: !isMobile(),
    position: isMobile() ? 'bottom' : 'top',
    delay: isMobile() ? 0 : 500,
  };
}

/**
 * Mobile-optimized dropdown configuration
 */
export function getMobileDropdownConfig() {
  return {
    fullWidth: isMobile(),
    showSearch: !isMobile(),
    maxHeight: isMobile() ? '200px' : '300px',
    closeOnSelect: isMobile(),
  };
}

/**
 * Mobile-optimized tabs configuration
 */
export function getMobileTabsConfig() {
  return {
    orientation: isMobile() ? 'horizontal' : 'horizontal',
    scrollable: isMobile(),
    showIcons: !isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized accordion configuration
 */
export function getMobileAccordionConfig() {
  return {
    allowMultiple: !isMobile(),
    showIcons: !isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized carousel configuration
 */
export function getMobileCarouselConfig() {
  return {
    showArrows: !isMobile(),
    showDots: true,
    autoplay: !isMobile(),
    infinite: !isMobile(),
  };
}

/**
 * Mobile-optimized grid configuration
 */
export function getMobileGridConfig() {
  return {
    columns: getResponsiveColumns(),
    gap: isMobile() ? '16px' : '24px',
    padding: isMobile() ? '16px' : '24px',
  };
}

/**
 * Mobile-optimized list configuration
 */
export function getMobileListConfig() {
  return {
    showIcons: !isMobile(),
    showDividers: !isMobile(),
    compact: isMobile(),
    padding: isMobile() ? '8px' : '16px',
  };
}

/**
 * Mobile-optimized pagination configuration
 */
export function getMobilePaginationConfig() {
  return {
    showFirstLast: !isMobile(),
    showPrevNext: true,
    showPageNumbers: !isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized search configuration
 */
export function getMobileSearchConfig() {
  return {
    showSuggestions: !isMobile(),
    showFilters: !isMobile(),
    fullWidth: isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized filter configuration
 */
export function getMobileFilterConfig() {
  return {
    showLabels: !isMobile(),
    orientation: isMobile() ? 'vertical' : 'horizontal',
    spacing: isMobile() ? 'compact' : 'normal',
  };
}

/**
 * Mobile-optimized sidebar configuration
 */
export function getMobileSidebarConfig() {
  return {
    overlay: isMobile(),
    position: isMobile() ? 'left' : 'left',
    width: isMobile() ? '280px' : '256px',
    collapsible: !isMobile(),
  };
}

/**
 * Mobile-optimized header configuration
 */
export function getMobileHeaderConfig() {
  return {
    height: isMobile() ? '56px' : '64px',
    showLogo: true,
    showNavigation: !isMobile(),
    showActions: !isMobile(),
    sticky: true,
  };
}

/**
 * Mobile-optimized footer configuration
 */
export function getMobileFooterConfig() {
  return {
    showLinks: !isMobile(),
    showSocial: !isMobile(),
    showCopyright: true,
    compact: isMobile(),
  };
}

/**
 * Mobile-optimized loading configuration
 */
export function getMobileLoadingConfig() {
  return {
    size: isMobile() ? 'lg' : 'md',
    showText: !isMobile(),
    overlay: isMobile(),
  };
}

/**
 * Mobile-optimized error configuration
 */
export function getMobileErrorConfig() {
  return {
    showDetails: !isMobile(),
    showActions: !isMobile(),
    fullWidth: isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized success configuration
 */
export function getMobileSuccessConfig() {
  return {
    showDetails: !isMobile(),
    showActions: !isMobile(),
    fullWidth: isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized warning configuration
 */
export function getMobileWarningConfig() {
  return {
    showDetails: !isMobile(),
    showActions: !isMobile(),
    fullWidth: isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}

/**
 * Mobile-optimized info configuration
 */
export function getMobileInfoConfig() {
  return {
    showDetails: !isMobile(),
    showActions: !isMobile(),
    fullWidth: isMobile(),
    size: isMobile() ? 'lg' : 'md',
  };
}
