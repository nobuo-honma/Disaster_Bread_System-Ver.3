/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Package, Box, Save, AlertTriangle,
    ArrowRightLeft, Loader2, CheckCircle2,
    Info, AlertCircle, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryService } from '../../services/inventoryService';
import { masterService } from '../../services/masterService';
import { manufacturingService } from '../../services/manufacturingService';

import {
    TItemStock,
    TProductStock,
    MItem,
    TMfgPlan,
    MBom,
    MProduct
} from '../../types';

// --- 型定義の補完 ---
type CategoryType = '原材料' | '資材' | '製品';

export default function Inventory() {
    const [activeSubTab, setActiveSubTab] = useState<CategoryType>('原材料');
    const [itemStocks, setItemStocks] = useState<TItemStock[]>([]);
    const [productStocks, setProductStocks] = useState<TProductStock[]>([]);
    const [items, setItems] = useState<MItem[]>([]);
    const [products, setProducts] = useState<MProduct[]>([]);
    const [plans, setPlans] = useState<TMfgPlan[]>([]);
    const [boms, setBoms] = useState<MBom[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStocktaking, setIsStocktaking] = useState(false);

    // 棚卸調整用: Record<ID, 数量>
    const [adjustments, setAdjustments] = useState<Record<string, number>>({});
    const [productAdjustments, setProductAdjustments] = useState<Record<string, { cs: number, p: number }>>({});

    // データ取得
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [iStocks, pStocks, mItems, mPlans, mBoms, mProducts] = await Promise.all([
                inventoryService.getItemStocks(),
                inventoryService.getProductStocks(),
                masterService.getItems(),
                manufacturingService.getAllPlans(),
                masterService.getAllBoms(),
                masterService.getProducts()
            ]);

            setItemStocks(iStocks || []);
            setProductStocks(pStocks || []);
            setItems(mItems || []);
            setPlans(mPlans || []);
            setBoms(mBoms || []);
            setProducts(mProducts || []);
        } catch (error) {
            console.error('Failed to fetch inventory assets:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /**
     * 製造計画に基づく使用予定量の計算
     * 原材料(kgベース)と資材(個数/ケースベース)をBOMの単位に従って算出
     */
    const calculatePlannedUsage = useCallback((itemId: string, category: string) => {
        if (!boms.length || !plans.length) return 0;

        const activePlans = plans.filter(p => p.status !== '完了');
        let totalUsage = 0;

        activePlans.forEach(plan => {
            const product = products.find(pr => pr.product_code === plan.product_code);
            if (!product) return;

            const relevantBoms = boms.filter(b => b.product_id === product.id && b.item_id === itemId);
            relevantBoms.forEach(bom => {
                // 原材料の場合は計画重量(kg)にBOM原単位を乗じる
                // 資材の場合は、資材数として計算（計画ケース数に依存する場合などロジックを調整）
                const baseAmount = category === '原材料' ? (plan.amount_kg || 0) : (plan.amount_cs || 0);
                totalUsage += baseAmount * (bom.quantity || 0);
            });
        });

        return totalUsage;
    }, [boms, plans, products]);

    /**
     * 在庫ステータス判定
     */
    const getStatus = (actual: number, planned: number, safety: number) => {
        const effective = actual - planned;
        if (effective < 0) return { label: '不足', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: <AlertCircle size={10} /> };
        if (effective < (safety || 0)) return { label: '注意', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <TrendingDown size={10} /> };
        return { label: '充足', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 size={10} /> };
    };

    /**
     * 棚卸データの保存
     */
    const handleSaveStocktaking = async () => {
        setIsSubmitting(true);
        try {
            // itemStocksの調整とproductStocksの調整をサービスへ送る
            await inventoryService.saveStocktaking(adjustments, productAdjustments);
            setIsStocktaking(false);
            setAdjustments({});
            setProductAdjustments({});
            await fetchData();
            alert('棚卸データを更新しました。');
        } catch (error) {
            console.error(error);
            alert('保存に失敗しました。システム管理者に連絡してください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = useMemo(() => items.filter(i => i.category === activeSubTab), [items, activeSubTab]);

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase">Auditing Inventory Assets...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-700">
            {/* ヘッダーセクション */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-800 pb-6 lg:pb-8 gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Package className="text-blue-500" size={14} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset / Inventory Management</span>
                    </div>
                    <h1 className="text-2xl lg:text-4xl font-black text-white italic tracking-tight">
                        在庫管理 <span className="text-slate-600 text-lg lg:text-xl font-light">/ Inventory</span>
                    </h1>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setIsStocktaking(!isStocktaking);
                            setAdjustments({});
                            setProductAdjustments({});
                        }}
                        disabled={isSubmitting}
                        className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${isStocktaking
                                ? 'bg-rose-950 border-rose-500 text-rose-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                            }`}
                    >
                        <ArrowRightLeft size={14} /> {isStocktaking ? '編集を破棄' : '棚卸モード開始'}
                    </button>
                    {isStocktaking && (
                        <button
                            onClick={handleSaveStocktaking}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            論理在庫を更新
                        </button>
                    )}
                </div>
            </header>

            {/* ナビゲーション & サマリー */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                    {(['原材料', '資材', '製品'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveSubTab(tab); setIsStocktaking(false); }}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* 凡例 */}
                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 充足</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> 注意 (安全在庫以下)</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> 不足 (計画割れ)</div>
                </div>
            </div>

            {/* 在庫テーブル */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    {activeSubTab !== '製品' ? (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-950/80 border-b border-slate-800">
                                    <th className="sticky left-0 bg-slate-950/90 backdrop-blur py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] z-10">品目マスター</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">現在庫</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right text-blue-400">使用予定量</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">有効在庫差分</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">需給状況</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">最終Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {filteredItems.map((item) => {
                                    const stock = itemStocks.find(s => s.item_code === item.item_code);
                                    const actual = stock?.actual_stock || 0;
                                    const planned = calculatePlannedUsage(item.id, item.category);
                                    const diff = actual - planned;
                                    const status = getStatus(actual, planned, item.safety_stock);

                                    return (
                                        <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="sticky left-0 bg-slate-900/90 backdrop-blur py-4 px-6 z-10">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-mono font-bold text-blue-500/80 tracking-tighter">{item.item_code}</span>
                                                    <span className="text-sm font-black text-slate-100 tracking-tight">{item.item_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {isStocktaking && stock ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <input
                                                            type="number"
                                                            value={adjustments[stock.id] ?? actual}
                                                            onChange={(e) => setAdjustments({ ...adjustments, [stock.id]: Number(e.target.value) })}
                                                            className="bg-slate-950 border-2 border-blue-500/50 rounded-lg px-3 py-1.5 text-right font-mono text-sm text-white outline-none focus:border-blue-400 w-28 shadow-inner"
                                                        />
                                                        <span className="text-[8px] text-slate-600 font-bold uppercase">現在: {actual}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-base font-mono font-black text-white">{actual.toLocaleString()}</span>
                                                        <span className="text-[9px] text-slate-500 font-black uppercase">{item.unit}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end opacity-80">
                                                    <span className="text-sm font-mono font-bold text-blue-400">-{planned.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                                                    <span className="text-[9px] text-blue-900 font-black uppercase">Reserved</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-sm font-black font-mono ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                                    </span>
                                                    <span className="text-[8px] text-slate-700 font-bold uppercase tracking-tighter">Availability</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border tracking-widest ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-[10px] font-mono font-medium text-slate-600">
                                                    {stock ? new Date(stock.updated_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        /* 製品在庫テーブル */
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-950/80 border-b border-slate-800">
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Product Ident</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">製造ロット</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">賞味期限</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">在庫 (ケース)</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">在庫 (バラ/P)</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">最終同期</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {productStocks.map((stock) => (
                                    <tr key={stock.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-200">{stock.product_code}</span>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Finished Good</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold text-amber-500">
                                                {stock.mfg_lot}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`text-xs font-mono font-bold ${new Date(stock.expiry_date) < new Date() ? 'text-rose-500' : 'text-slate-400'
                                                }`}>
                                                {stock.expiry_date}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {isStocktaking ? (
                                                <input
                                                    type="number"
                                                    value={productAdjustments[stock.id]?.cs ?? stock.stock_cs}
                                                    onChange={(e) => setProductAdjustments({
                                                        ...productAdjustments,
                                                        [stock.id]: { ...(productAdjustments[stock.id] || { p: stock.stock_p }), cs: Number(e.target.value) }
                                                    })}
                                                    className="bg-slate-950 border border-blue-500/50 rounded-lg px-3 py-1.5 text-right font-mono text-sm text-white w-24"
                                                />
                                            ) : (
                                                <span className="text-base font-mono font-black text-white">{stock.stock_cs.toLocaleString()}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {isStocktaking ? (
                                                <input
                                                    type="number"
                                                    value={productAdjustments[stock.id]?.p ?? stock.stock_p}
                                                    onChange={(e) => setProductAdjustments({
                                                        ...productAdjustments,
                                                        [stock.id]: { ...(productAdjustments[stock.id] || { cs: stock.stock_cs }), p: Number(e.target.value) }
                                                    })}
                                                    className="bg-slate-950 border border-blue-500/50 rounded-lg px-3 py-1.5 text-right font-mono text-sm text-white w-24"
                                                />
                                            ) : (
                                                <span className="text-sm font-mono font-bold text-slate-400">{stock.stock_p.toLocaleString()}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-[10px] font-mono text-slate-600">{new Date(stock.updated_at).toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* アラートバナー */}
            <AnimatePresence>
                {isStocktaking && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex items-center gap-4 p-5 bg-blue-950/40 border-2 border-blue-500/30 rounded-3xl backdrop-blur-md"
                    >
                        <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 shadow-inner">
                            <Info size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Inventory Adjustment Mode</p>
                            <p className="text-[10px] font-bold text-blue-300/60 uppercase leading-relaxed">
                                現在、実地在庫との差異を調整中です。<br />
                                数値を入力し「保存」を押すと、システムの論理在庫データが上書きされます。
                            </p>
                        </div>
                        <div className="hidden sm:block px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <span className="text-[10px] font-black text-blue-400/80 uppercase">Editing: {Object.keys(adjustments).length + Object.keys(productAdjustments).length} items</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 足りない資材のアラート（自動集計） */}
            {!isStocktaking && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.filter(i => {
                        const stock = itemStocks.find(s => s.item_code === i.item_code);
                        return (stock?.actual_stock || 0) < calculatePlannedUsage(i.id, i.category);
                    }).length > 0 && (
                            <div className="flex items-start gap-4 p-5 bg-rose-950/20 border border-rose-500/20 rounded-2xl">
                                <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Critical Shortage Alert</h4>
                                    <p className="text-[10px] text-rose-300/70 font-bold leading-normal">
                                        製造計画に対して在庫が不足している品目があります。発注依頼を確認してください。
                                    </p>
                                </div>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}