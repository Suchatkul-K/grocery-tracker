import { categoryRepository } from '../repositories/category.repository';
import { Category } from '@/types';
import { getNextCategoryColor } from '../constants/colors';

/**
 * Service for category business logic
 */
class CategoryService {
  /**
   * Create a new category with automatic color assignment
   * If no color is provided, assigns the next available color from the palette
   */
  async createCategory(
    name: string,
    householdId: string,
    color?: string
  ): Promise<Category> {
    let assignedColor = color;

    // If no color provided, assign next available color
    if (!assignedColor) {
      const existingCategories = categoryRepository.getCategories(householdId);
      const existingColors = existingCategories.map(cat => cat.color);
      assignedColor = getNextCategoryColor(existingColors);
    }

    return categoryRepository.createCategory(name, assignedColor, householdId);
  }

  /**
   * Get all categories for a household
   */
  getCategories(householdId: string): Category[] {
    return categoryRepository.getCategories(householdId);
  }

  /**
   * Get a category by ID
   */
  getCategory(id: string): Category | null {
    return categoryRepository.getCategory(id);
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, name?: string, color?: string): Promise<void> {
    return categoryRepository.updateCategory(id, name, color);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    return categoryRepository.deleteCategory(id);
  }
}

export const categoryService = new CategoryService();

