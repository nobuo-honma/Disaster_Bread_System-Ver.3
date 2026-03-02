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
  async getBOM(productId: string): Promise<MBom[]> {
    const { data, error } = await supabase.from('m_boms').select('*').eq('product_id', productId);
    if (error) throw error;
    return data || [];
  },
  async saveBOM(productId: string, entries: Partial<MBom>[]): Promise<void> {
    const { error: deleteError } = await supabase.from('m_boms').delete().eq('product_id', productId);
    if (deleteError) throw deleteError;
    if (entries.length > 0) {
      const { error: insertError } = await supabase.from('m_boms').insert(entries.map(e => ({ ...e, product_id: productId })));
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
