/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TOrder } from '../types';
import { supabase } from '../lib/supabase';

export const orderService = {
  async saveOrder(orderHeader: any, orderDetails: any[]): Promise<void> {
    // Assuming t_orders holds the order info. In a real app, details would be in a separate table.
    const { error } = await supabase
      .from('t_orders')
      .upsert(orderHeader);

    if (error) throw error;
    // Handle orderDetails if necessary
  },
  async getPendingOrders(): Promise<TOrder[]> {
    const { data, error } = await supabase
      .from('t_orders')
      .select('*')
      .neq('status', '出荷済')
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
  async getOrders(): Promise<TOrder[]> {
    const { data, error } = await supabase
      .from('t_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
