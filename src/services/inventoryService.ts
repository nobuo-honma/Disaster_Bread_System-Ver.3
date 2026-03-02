/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TItemStock, TProductStock, TStocktakingLog } from '../types';
import { supabase } from '../lib/supabase';

export const inventoryService = {
  async getItemStocks(category?: string): Promise<TItemStock[]> {
    console.log('Fetching item stocks for', category);
    let query = supabase.from('t_item_stocks').select('*, m_items!inner(category)');

    if (category) {
      query = query.eq('m_items.category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Simplification: the join might need mapping depending on the actual response structure
    return (data as any[]) || [];
  },
  async getProductStocks(): Promise<TProductStock[]> {
    const { data, error } = await supabase
      .from('t_product_stocks')
      .select('*')
      .order('expiry_date');

    if (error) throw error;
    return data || [];
  },
  async saveStocktaking(adjustments: any[], productAdjustments: any[]): Promise<void> {
    // Logic to save multiple adjustments would go here
    // For now, assume upsert/insert into logs
    console.log('Saving stocktaking', adjustments, productAdjustments);
  },
  async getStocktakingLogs(): Promise<TStocktakingLog[]> {
    const { data, error } = await supabase
      .from('t_stocktaking_logs')
      .select('*')
      .order('adjusted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
  async confirmShipping(order: any, lotQuantities: any, shippingDate: string): Promise<void> {
    console.log('Confirming shipping', order, lotQuantities, shippingDate);
  }
};