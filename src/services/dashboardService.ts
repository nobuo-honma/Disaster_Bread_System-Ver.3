/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TItemStock, TMfgPlan, TStocktakingLog } from '../types';
import { supabase } from '../lib/supabase';

export const dashboardService = {
  async getDashboardData() {
    const today = new Date().toISOString().slice(0, 10);

    const [stocksRes, plansRes, logsRes] = await Promise.all([
      supabase.from('t_item_stocks').select('*').in('stock_status', ['在庫低下', '欠品']),
      supabase.from('t_mfg_plans').select('*').eq('scheduled_date', today).order('scheduled_date'),
      supabase.from('t_stocktaking_logs').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    if (stocksRes.error) throw stocksRes.error;
    if (plansRes.error) throw plansRes.error;
    if (logsRes.error) throw logsRes.error;

    return {
      alerts: (stocksRes.data || []) as TItemStock[],
      todayPlans: (plansRes.data || []) as TMfgPlan[],
      stocktakingLogs: (logsRes.data || []) as TStocktakingLog[],
    };
  }
};
