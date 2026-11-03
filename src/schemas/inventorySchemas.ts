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
    .max(50, 'SKU must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().min(1, 'Please select a valid category'),
  price: z.number().min(0, 'Price must be a nonnegative number'),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock must be a nonnegative integer'),
  lowStockThreshold: z
    .number()
    .int('Low-stock threshold must be an integer')
    .min(0, 'Low-stock threshold must be a nonnegative integer'),
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
    .max(50, 'SKU must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().min(1, 'Please select a valid category'),
  price: z.number().min(0, 'Price must be a nonnegative number'),
  lowStockThreshold: z
    .number()
    .int('Low-stock threshold must be an integer')
    .min(0, 'Low-stock threshold must be a nonnegative integer'),
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
