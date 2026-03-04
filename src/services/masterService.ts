/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MProduct, MItem, MBom, MDestination, MUser } from '../types';
import { supabase } from '../lib/supabase';

export const masterService = {
  // Products
  async getProducts(): Promise<MProduct[]> {
    const { data, error } = await supabase.from('m_products').select('*');
    if (error) throw error;
    return data || [];
  },
  async saveProduct(product: Partial<MProduct>): Promise<void> {
    const { error } = await supabase.from('m_products').upsert(product);
    if (error) throw error;
  },

  // Items
  async getItems(): Promise<MItem[]> {
    const { data, error } = await supabase.from('m_items').select('*');
    if (error) throw error;
    return data || [];
  },
  async saveItem(item: Partial<MItem>): Promise<void> {
    const { error } = await supabase.from('m_items').upsert(item);
    if (error) throw error;
  },

  // BOM
  /**
   * 在庫管理画面などで使用：すべてのBOMデータを一括取得する
   */
  async getAllBoms(): Promise<MBom[]> {
    const { data, error } = await supabase.from('m_bom').select('*');
    if (error) {
      console.warn('BOM全件取得エラー:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * 特定の製品編集などで使用：指定されたproductCodeのBOMのみ取得する
   */
  async getBOM(productCode: string): Promise<MBom[]> {
    const { data, error } = await supabase.from('m_bom').select('*').eq('product_code', productCode);
    if (error) throw error;
    return data || [];
  },

  async saveBOM(productCode: string, entries: Partial<MBom>[]): Promise<void> {
    const { error: deleteError } = await supabase.from('m_bom').delete().eq('product_code', productCode);
    if (deleteError) throw deleteError;
    if (entries.length > 0) {
      const { error: insertError } = await supabase.from('m_bom').insert(entries.map(e => ({ ...e, product_code: productCode })));
      if (insertError) throw insertError;
    }
  },

  // Destinations
  async getDestinations(): Promise<MDestination[]> {
    const { data, error } = await supabase.from('m_destinations').select('*');
    if (error) throw error;
    return data || [];
  },
  async saveDestination(dest: Partial<MDestination>): Promise<void> {
    const { error } = await supabase.from('m_destinations').upsert(dest);
    if (error) throw error;
  },

  // Users
  async getUsers(): Promise<MUser[]> {
    const { data, error } = await supabase.from('m_users').select('*');
    if (error) throw error;
    return data || [];
  },
  async saveUser(user: Partial<MUser>): Promise<void> {
    const { error } = await supabase.from('m_users').upsert(user);
    if (error) throw error;
  }
};