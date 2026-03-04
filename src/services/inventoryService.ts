/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TItemStock, TProductStock, TStocktakingLog } from '../types';
import { supabase } from '../lib/supabase';

export const inventoryService = {
  async getItemStocks(category?: string): Promise<TItemStock[]> {
    let query = supabase.from('t_item_stock').select('*');
    if (category) {
      // Assuming item_stocks has a join or category field
      // For now, just fetching all and filtering if needed or assuming schema supports it
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  async getProductStocks(): Promise<TProductStock[]> {
    const { data, error } = await supabase.from('t_product_stock').select('*');
    if (error) throw error;
    return data || [];
  },
  async saveStocktaking(
    payload: { itemCode: string; afterStock: number; remarks: string }[]
  ): Promise<void> {
    for (const entry of payload) {
      // 現在庫を取得
      const { data: current } = await supabase
        .from('t_item_stock')
        .select('actual_stock')
        .eq('item_code', entry.itemCode)
        .single();

      const beforeStock = current?.actual_stock ?? 0;

      // 在庫数を更新
      const { error: updateErr } = await supabase
        .from('t_item_stock')
        .update({ actual_stock: entry.afterStock, updated_at: new Date().toISOString() })
        .eq('item_code', entry.itemCode);
      if (updateErr) throw updateErr;

      // 棚卸ログを記録
      const { error: logErr } = await supabase
        .from('t_stocktaking_log')
        .insert({
          item_code: entry.itemCode,
          before_stock: beforeStock,
          after_stock: entry.afterStock,
          remarks: entry.remarks,
          adjusted_at: new Date().toISOString(),
        });
      if (logErr) throw logErr;
    }
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
