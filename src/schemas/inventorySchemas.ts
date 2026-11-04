import { z } from 'zod';

export const itemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters'),
  categoryId: z.string().min(1, 'Please select a valid category'),
  price: z
    .number({ error: 'Unit price is required' })
    .positive('Unit price must be greater than 0'),
  stock: z
    .number({ error: 'Initial stock is required' })
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative'),
  lowStockThreshold: z
    .number({ error: 'Threshold is required' })
    .int('Low-stock threshold must be an integer')
    .min(0, 'Threshold cannot be negative'),
});

export type ItemFormData = z.infer<typeof itemSchema>;

export const editItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters'),
  categoryId: z.string().min(1, 'Please select a valid category'),
  price: z
    .number({ error: 'Unit price is required' })
    .positive('Unit price must be greater than 0'),
  lowStockThreshold: z
    .number({ error: 'Threshold is required' })
    .int('Low-stock threshold must be an integer')
    .min(0, 'Threshold cannot be negative'),
});

export type EditItemFormData = z.infer<typeof editItemSchema>;

export const stockMovementFormSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be a positive integer'),
  reason: z.string().trim().min(1, 'Please provide a reason for this movement'),
});

export type StockMovementFormData = z.infer<typeof stockMovementFormSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username / Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(60, 'Category name must be less than 60 characters'),
  description: z
    .string()
    .trim()
    .max(300, 'Description must be less than 300 characters')
    .optional()
    .or(z.literal('')),
  lowStockThreshold: z
    .number()
    .int('Low-stock threshold must be an integer')
    .min(0, 'Low-stock threshold must be nonnegative'),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
