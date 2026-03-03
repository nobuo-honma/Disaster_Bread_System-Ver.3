/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TMfgPlan, TProductStock } from '../types';
import { supabase } from '../lib/supabase';

export const manufacturingService = {
  async getPlansByOrder(orderCode: string): Promise<TMfgPlan[]> {
    const { data, error } = await supabase.from('t_mfg_plans').select('*').eq('order_code', orderCode);
    if (error) throw error;
    return data || [];
  },

  async getAllPlans(): Promise<TMfgPlan[]> {
    const { data, error } = await supabase.from('t_mfg_plans').select('*');
    if (error) throw error;
    return data || [];
  },

  async savePlans(orderCode: string, plans: Partial<TMfgPlan>[]): Promise<void> {
    // Delete existing plans for this order and insert new ones
    const { error: deleteError } = await supabase.from('t_mfg_plans').delete().eq('order_code', orderCode);
    if (deleteError) throw deleteError;
    if (plans.length > 0) {
      const { error: insertError } = await supabase.from('t_mfg_plans').insert(plans.map(p => ({ ...p, order_code: orderCode })));
      if (insertError) throw insertError;
    }
  },

  async updatePlanStatus(planId: string, status: string): Promise<void> {
    const { error } = await supabase.from('t_mfg_plans').update({ status }).eq('id', planId);
    if (error) throw error;
  },

  async updatePlanDate(planId: string, date: string): Promise<void> {
    const { error } = await supabase.from('t_mfg_plans').update({ scheduled_date: date }).eq('id', planId);
    if (error) throw error;
  },

  async saveProductionResult(result: Partial<TProductStock>): Promise<void> {
    const { error } = await supabase.from('t_product_stock').insert(result);
    if (error) throw error;
  }
};
