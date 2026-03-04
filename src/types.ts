/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MProduct {
  id: string;
  product_code: string;
  product_name: string;
  mfg_type: string;
  units_per_kg: number;
  units_per_cs: number;
  product_category: string;
  is_active: boolean;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MItem {
  id: string;
  item_code: string;
  item_name: string;
  category: '原材料' | '資材';
  unit: string;
  min_stock: number;
  is_active?: boolean;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MBom {
  id: string;
  product_id: string;
  product_code: string;
  item_id: string;
  item_code: string;
  quantity: number;
  usage_rate?: number;
  basis_unit?: '製造量' | '受注数';
  unit?: string;
}

export interface MDestination {
  id: string;
  destination_code: string;
  destination_name: string;
  zip_code?: string;
  address?: string;
  tel?: string;
  contact_person?: string;
  remarks?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface TOrder {
  id: string;
  order_code: string;
  order_date: string;
  destination_code: string;
  request_delivery_date: string;
  product_code: string;
  product_name_at_order: string;
  quantity_cs: number;
  status: string;
  remarks?: string;
}

export interface TMfgPlan {
  id: string;
  plan_code: string;
  product_code: string;
  order_code: string;
  scheduled_date: string;
  amount_kg: number;
  amount_cs: number;
  status: string;
  remarks?: string;
}

export interface TItemStock {
  id: string;
  item_code: string;
  actual_stock: number;
  available_stock: number;
  stock_status: string;
  updated_at: string;
  m_items?: {
    item_name: string;
  };
}

export interface TProductStock {
  id: string;
  product_code: string;
  mfg_lot: string;
  stock_cs: number;
  stock_p: number;
  expiry_date: string;
  remarks?: string;
  updated_at: string;
  m_products?: {
    product_name: string;
  };
}

export interface TReceiving {
  id: string;
  receiving_code: string;
  item_code: string;
  scheduled_date: string;
  order_quantity: number;
  actual_quantity?: number;
  status: '未入荷' | '一部入荷' | '入荷済';
  remarks?: string;
  updated_at?: string;
}

export interface TStocktakingLog {
  id: string;
  item_code: string;
  before_stock: number;
  after_stock: number;
  difference?: number;
  remarks: string;
  adjusted_at: string;
  created_at?: string;
}
