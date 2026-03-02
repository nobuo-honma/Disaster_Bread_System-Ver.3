/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TReceiving } from '../types';
import { supabase } from '../lib/supabase';

export const receivingService = {
  async getReceivings(): Promise<TReceiving[]> {
    const { data, error } = await supabase
      .from('t_receivings')
      .select('*')
      .order('scheduled_date');

    if (error) throw error;
    return data || [];
  },
  async saveReceiving(rec: Partial<TReceiving>): Promise<void> {
    const { error } = await supabase
      .from('t_receivings')
      .upsert(rec);

    if (error) throw error;
  },
  async getReceivingList(): Promise<TReceiving[]> {
    const { data, error } = await supabase
      .from('t_receivings')
      .select('*')
      .order('scheduled_date');

    if (error) throw error;
    return data || [];
  },
  async registerReceiving(data: Partial<TReceiving>): Promise<void> {
    const { error } = await supabase
      .from('t_receivings')
      .upsert(data);

    if (error) throw error;
  },
  async processReceiving(row: TReceiving, actualQty: number): Promise<void> {
    const { error } = await supabase
      .from('t_receivings')
      .update({ actual_quantity: actualQty, status: '入荷済' })
      .eq('id', row.id);

    if (error) throw error;
  }
};
