/**
 * Predefined color palette for categories
 * These colors are used to visually distinguish categories in the UI
 */
export const CATEGORY_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B88B', // Peach
  '#A8E6CF', // Light Green
] as const;

/**
 * Status colors for visual indicators
 */
export const STATUS_COLORS = {
  lowStock: '#FF9800', // Orange
  expired: '#F44336', // Red
  expiringSoon: '#FFC107', // Amber
  normal: '#4CAF50', // Green
} as const;

/**
 * Get a color from the palette by index
 * Wraps around if index exceeds palette length
 */
export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

/**
 * Get the next available color for a household
 * Returns a color that hasn't been used yet, or cycles through the palette
 */
export function getNextCategoryColor(existingColors: string[]): string {
  // Find first color not in use
  for (const color of CATEGORY_COLORS) {
    if (!existingColors.includes(color)) {
      return color;
    }
  }
  
  // All colors used, return first color (will cycle)
  return CATEGORY_COLORS[0];
}

