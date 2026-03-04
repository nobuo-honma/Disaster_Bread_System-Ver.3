/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Layers, Plus, Save, Trash2, Package, Box, ArrowRight } from 'lucide-react';
import { masterService } from '../../services/masterService';
import { MProduct, MItem, MBom } from '../../types';

export default function BOMMaster() {
    const [products, setProducts] = useState<MProduct[]>([]);
    const [items, setItems] = useState<MItem[]>([]);
    const [selectedProductCode, setSelectedProductCode] = useState<string>('');
    const [bomEntries, setBomEntries] = useState<Partial<MBom>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const [pData, iData] = await Promise.all([
                    masterService.getProducts(),
                    masterService.getItems()
                ]);
                setProducts(pData);
                setItems(iData);
            } catch (error) {
                console.error('Failed to parse configuration tree:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchBOM = async (product: MProduct) => {
        setSelectedProductId(product.id);
        setSelectedProductCode(product.product_code); // 追加state
        const data = await masterService.getBOM(product.product_code);
        setBomEntries(data);
    };
    // saveBOM時も selectedProductCode を使う
    await masterService.saveBOM(selectedProductCode, cleanEntries);

    // 呼び出し側
    onClick = {() => fetchBOM(p)
} // p.idではなくpオブジェクトごと渡す

const handleSaveBOM = async () => {
    if (!selectedProductCode) return;
    const product = products.find(p => p.product_code === selectedProductCode);
    if (!product) return;

    const cleanEntries = bomEntries
        .filter(e => e.item_code && e.quantity && e.quantity > 0)
        .map(e => {
            const item = items.find(i => i.item_code === e.item_code);
            return {
                ...e,
                product_id: product.id,
                product_code: product.product_code,
                item_id: item?.id,
                item_code: item?.item_code || '',
                unit: item?.unit || ''
            };
        });

    try {
        await masterService.saveBOM(selectedProductCode, cleanEntries);
        alert('BOM設定を更新しました');
        fetchBOM(selectedProductCode);
    } catch (error) {
        console.error('Failed to save BOM:', error);
        alert('保存に失敗しました');
    }
};

const addRow = () => {
    if (!selectedProductCode) return;
    setBomEntries([...bomEntries, { product_code: selectedProductCode, item_code: '', quantity: 0 }]);
};

if (loading) return <div className="p-10 text-center text-slate-500 font-black animate-pulse uppercase tracking-[0.3em] text-xs">Parsing Configuration Tree...</div>;

return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-800 pb-6 lg:pb-8 gap-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Layers className="text-indigo-400" size={16} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Data / Composition Recipe</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-white italic">BOM管理 <span className="text-slate-600 text-lg lg:text-xl font-light">/ 部品構成表</span></h1>
            </div>
        </div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
            <aside className="lg:col-span-4 space-y-4 order-2 lg:order-1">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-2xl">
                    <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Package size={14} /> Select Target Product
                    </h2>
                    <div className="space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {products.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => fetchBOM(p.product_code)}
                                className={`w-full text-left p-4 rounded-xl lg:rounded-2xl border transition-all duration-300 group ${selectedProductCode === p.product_code
                                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className={`text-[10px] font-mono font-black mb-1 ${selectedProductCode === p.product_code ? 'text-indigo-400' : 'text-slate-500'}`}>
                                            {p.product_code}
                                        </div>
                                        <div className="text-sm font-black text-slate-200 group-hover:text-white transition-colors">
                                            {p.product_name}
                                        </div>
                                    </div>
                                    {selectedProductCode === p.product_code && <ArrowRight size={16} className="text-indigo-500 animate-pulse" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            <main className="lg:col-span-8 order-1 lg:order-2">
                {selectedProductCode ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[400px] lg:min-h-[500px]">
                        <div className="p-4 lg:p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                            <h3 className="text-[10px] lg:text-sm font-black text-white flex items-center gap-2">
                                <Box size={16} className="text-indigo-400" />
                                構成品目リスト
                            </h3>
                            <button
                                onClick={addRow}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                <Plus size={14} /> Add Item
                            </button>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="bg-slate-950/50 border-b border-slate-800">
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">使用品目 (原材料・資材)</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-40 text-right">必要数量</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-20 text-center">単位</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {bomEntries.map((entry, index) => (
                                        <tr key={index} className="group hover:bg-slate-800/10">
                                            <td className="py-4 px-6">
                                                <select
                                                    value={entry.item_code}
                                                    onChange={(e) => {
                                                        const newEntries = [...bomEntries];
                                                        newEntries[index].item_code = e.target.value;
                                                        setBomEntries(newEntries);
                                                    }}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                >
                                                    <option value="">品目を選択してください</option>
                                                    {items.map(i => (
                                                        <option key={i.id} value={i.item_code}>{i.item_code} : {i.item_name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={entry.quantity}
                                                    onChange={(e) => {
                                                        const newEntries = [...bomEntries];
                                                        newEntries[index].quantity = Number(e.target.value);
                                                        setBomEntries(newEntries);
                                                    }}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white text-right font-mono outline-none focus:border-indigo-500"
                                                />
                                            </td>
                                            <td className="py-4 px-6 text-center text-[10px] font-bold text-slate-500">
                                                {items.find(i => i.item_code === entry.item_code)?.unit || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => setBomEntries(bomEntries.filter((_, i) => i !== index))}
                                                    className="text-slate-600 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 lg:p-6 border-t border-slate-800 bg-slate-900/50">
                            <button
                                onClick={handleSaveBOM}
                                disabled={bomEntries.length === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Save Product Recipe (BOM)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] lg:min-h-[500px] border-2 border-dashed border-slate-800 rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <Layers size={48} className="opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest opacity-40">Please select a product to edit its BOM</p>
                    </div>
                )}
            </main>
        </div>
    </div>
);
}
