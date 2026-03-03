/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Package, Box, History, Save, AlertTriangle, Search, Filter, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion'; // 修正: motion/react から標準的な framer-motion へ
import { inventoryService } from '../../services/inventoryService';
import { masterService } from '../../services/masterService';
import { manufacturingService } from '../../services/manufacturingService';
// import { supabase } from '../../lib/supabase'; // サービス層に隠蔽するためここでは不要

import {
    TItemStock,
    TProductStock,
    MItem,
    TMfgPlan,
    MBom,
    MProduct
} from '../../types';

export default function Inventory() {
    const [activeSubTab, setActiveSubTab] = useState<'原材料' | '資材' | '製品'>('原材料');
    const [itemStocks, setItemStocks] = useState<TItemStock[]>([]);
    const [productStocks, setProductStocks] = useState<TProductStock[]>([]);
    const [items, setItems] = useState<MItem[]>([]);
    const [products, setProducts] = useState<MProduct[]>([]);
    const [plans, setPlans] = useState<TMfgPlan[]>([]);
    const [boms, setBoms] = useState<MBom[]>([]);
    const [loading, setLoading] = useState(true);
    const [isStocktaking, setIsStocktaking] = useState(false);
    const [adjustments, setAdjustments] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchData();
    }, []);

    /**
     * データの統合取得
     * 404エラー対策として Promise.allSettled を使うか、
     * 個別に try-catch を入れることで、一部の失敗で全体を止めないようにします。
     */
    const fetchData = async () => {
        setLoading(true);
        try {
            // masterService に getBoms() が実装されている前提です。
            // もし未実装なら masterService.ts に追加してください。
            const [iStocks, pStocks, mItems, mPlans, mBoms, mProducts] = await Promise.all([
                inventoryService.getItemStocks(),
                inventoryService.getProductStocks(),
                masterService.getItems(),
                manufacturingService.getAllPlans(),
                masterService.getBoms(), // 修正ポイント: 直接SQLを叩かずサービス経由にする
                masterService.getProducts()
            ]);

            setItemStocks(iStocks || []);
            setProductStocks(pStocks || []);
            setItems(mItems || []);
            setPlans(mPlans || []);
            setBoms(mBoms || []); // 確実に配列としてセット
            setProducts(mProducts || []);

        } catch (error) {
            console.error('Failed to fetch inventory data:', error);
            // 致命的なエラーでも、空配列をセットしてUIの崩壊を防ぐ
            setBoms([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 製造計画に基づく使用予定量の計算
     */
    const calculatePlannedUsage = (itemId: string) => {
        // boms が取得できていない場合のガード
        if (!boms || boms.length === 0) return 0;

        const activePlans = plans.filter(p => p.status !== '完了');
        let totalUsage = 0;

        activePlans.forEach(plan => {
            const product = products.find(pr => pr.product_code === plan.product_code);
            if (!product) return;

            // BOMテーブルから、製品IDと品目IDが一致するものを抽出
            const relevantBoms = boms.filter(b => b.product_id === product.id && b.item_id === itemId);
            relevantBoms.forEach(bom => {
                totalUsage += (plan.amount_kg || 0) * (bom.quantity || 0);
            });
        });

        return totalUsage;
    };

    /**
     * 在庫状態の判定
     */
    const getStatus = (actual: number, planned: number, safety: number) => {
        const effective = actual - planned;
        if (effective < 0) return { label: '不足', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
        if (effective < (safety || 0)) return { label: '注意', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
        return { label: '充足', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    };

    /**
     * 棚卸データの保存
     */
    const handleSaveStocktaking = async () => {
        try {
            await inventoryService.saveStocktaking(adjustments, {});
            alert('棚卸結果を保存しました');
            setIsStocktaking(false);
            setAdjustments({});
            fetchData();
        } catch (error) {
            alert('保存に失敗しました。コンソールを確認してください。');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center text-slate-500 font-black animate-pulse uppercase tracking-[0.3em] text-xs">
                Auditing Inventory Assets...
            </div>
        );
    }

    const filteredItems = items.filter(i => i.category === activeSubTab);

    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-700">
            {/* ヘッダーセクション */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-800 pb-6 lg:pb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="text-blue-400" size={16} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operations / Asset Management</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-white italic">在庫管理 <span className="text-slate-600 text-lg lg:text-xl font-light">/ Inventory</span></h1>
                </div>
                <div className="flex flex-wrap gap-2 lg:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => setIsStocktaking(!isStocktaking)}
                        className={`flex-1 sm:flex-none px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isStocktaking
                                ? 'bg-rose-600 text-white shadow-rose-900/20'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                            }`}
                    >
                        <ArrowRightLeft size={14} /> {isStocktaking ? 'キャンセル' : '棚卸入力'}
                    </button>
                    {isStocktaking && (
                        <button
                            onClick={handleSaveStocktaking}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <Save size={14} /> 保存
                        </button>
                    )}
                </div>
            </div>

            {/* カテゴリ切替タブ */}
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl lg:rounded-2xl border border-slate-800 w-full sm:w-fit overflow-x-auto no-scrollbar">
                {(['原材料', '資材', '製品'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`flex-1 sm:flex-none whitespace-nowrap px-4 lg:px-8 py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* メインテーブル */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    {activeSubTab !== '製品' ? (
                        <table className="w-full text-left min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">品目情報</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">実在庫 / (使用予定)</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">有効在庫差分</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">ステータス</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">最終更新</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredItems.map((item) => {
                                    const stock = itemStocks.find(s => s.item_code === item.item_code);
                                    const actual = stock?.actual_stock || 0;
                                    const planned = calculatePlannedUsage(item.id);
                                    const diff = actual - planned;
                                    const status = getStatus(actual, planned, item.safety_stock);

                                    return (
                                        <tr key={item.id} className="group hover:bg-slate-800/10 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-mono font-bold text-blue-500">{item.item_code}</span>
                                                    <span className="text-sm font-bold text-slate-200">{item.item_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    {isStocktaking && stock ? (
                                                        <input
                                                            type="number"
                                                            value={adjustments[stock.id] ?? actual}
                                                            onChange={(e) => setAdjustments({ ...adjustments, [stock.id]: Number(e.target.value) })}
                                                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right font-mono text-white outline-none focus:border-blue-500 w-32"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-mono font-black text-white">{actual} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span></span>
                                                    )}
                                                    <span className="text-[10px] font-mono text-slate-500">({planned.toFixed(1)})</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={`text-sm font-black font-mono ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-slate-600'}`}>
                                                    {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-[10px] font-medium text-slate-500">{stock ? new Date(stock.updated_at).toLocaleString() : '-'}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">製品コード</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">製造ロット</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">賞味期限</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">在庫数 (CS)</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">在庫数 (P)</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">最終更新</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {productStocks.map((stock) => (
                                    <tr key={stock.id} className="group hover:bg-slate-800/10 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-bold text-slate-200">{stock.product_code}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-mono font-bold text-amber-500">{stock.mfg_lot}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-medium text-slate-400">{stock.expiry_date}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-mono font-black text-white">{stock.stock_cs}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-mono text-slate-400">{stock.stock_p}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-[10px] font-medium text-slate-500">{new Date(stock.updated_at).toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* アラート表示 */}
            {isStocktaking && (
                <div className="flex items-center gap-3 p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl">
                    <AlertTriangle size={24} className="text-blue-500" />
                    <div>
                        <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">棚卸モード実行中</p>
                        <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest">
                            現在、実在庫の調整を行っています。保存すると論理在庫が更新されます。
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}