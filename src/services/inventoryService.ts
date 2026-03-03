/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TItemStock, TProductStock, TStocktakingLog } from '../types';
import { supabase } from '../lib/supabase';

export const inventoryService = {
  async getItemStocks(category?: string): Promise<TItemStock[]> {
    let query = supabase.from('t_item_stock').select('*, m_items(item_name)');
    if (category) {
      // Assuming item_stocks has a join or category field
      // For now, just fetching all and filtering if needed or assuming schema supports it
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  async getProductStocks(): Promise<TProductStock[]> {
    const { data, error } = await supabase.from('t_product_stock').select('*, m_products(product_name)');
    if (error) throw error;
    return data || [];
  },
  async saveStocktaking(adjustments: any, productAdjustments: any): Promise<void> {
    // Implement stocktaking logic (e.g., insert into logs and update current stocks)
    console.log('Saving stocktaking to Supabase', adjustments, productAdjustments);
    // This would typically involve a transaction or multiple calls
  },
  async getStocktakingLogs(): Promise<TStocktakingLog[]> {
    const { data, error } = await supabase.from('t_stocktaking_log').select('*').order('adjusted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async confirmShipping(order: any, lotQuantities: any, shippingDate: string): Promise<void> {
    console.log('Confirming shipping in Supabase', order, lotQuantities, shippingDate);
    // Logic to decrease product stock and create shipping record
  }
};
