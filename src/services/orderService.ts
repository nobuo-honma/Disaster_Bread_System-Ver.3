/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TOrder } from '../types';
import { supabase } from '../lib/supabase';

export const orderService = {
  async saveOrder(orderHeader: any, orderDetails: any[]): Promise<void> {
    const { error } = await supabase.from('t_orders').insert({
      ...orderHeader,
      // Assuming orderDetails is handled separately or as a JSON column
    });
    if (error) throw error;
  },
  async getPendingOrders(): Promise<TOrder[]> {
    const { data, error } = await supabase.from('t_orders').select('*').eq('status', '未出荷');
    if (error) throw error;
    return data || [];
  },
  async getOrders(): Promise<TOrder[]> {
    const { data, error } = await supabase.from('t_orders').select('*');
    if (error) throw error;
    return data || [];
  }
};
