import React, { useState } from "react";
import { Package, Plus, Minus, Search, AlertTriangle, ShieldCheck, ShoppingBag } from "lucide-react";
import { InventoryItem } from "../types";
import { compressImage } from "../lib/imageCompression";

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onAddItem: (item: InventoryItem) => void;
  onEditItem?: (item: InventoryItem) => void;
  onDeleteItem?: (id: string) => void;
  initialFilterLowStock: boolean;
  onClearLowStockFilter: () => void;
}

export default function InventoryManager({
  inventory,
  onUpdateQuantity,
  onAddItem,
  onEditItem,
  onDeleteItem,
  initialFilterLowStock,
  onClearLowStockFilter,
}: InventoryManagerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  
  // Adding modal triggers/form
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemMinQty, setNewItemMinQty] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Artesanato");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [newItemCostPrice, setNewItemCostPrice] = useState("");
  const [newItemProfitMargin, setNewItemProfitMargin] = useState("");

  // Editing state for products
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemCategory, setEditItemCategory] = useState("Artesanato");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemCostPrice, setEditItemCostPrice] = useState("");
  const [editItemProfitMargin, setEditItemProfitMargin] = useState("");
  const [editItemQty, setEditItemQty] = useState("");
  const [editItemMinQty, setEditItemMinQty] = useState("");
  const [editItemImageUrl, setEditItemImageUrl] = useState("");

  // Bi-directional automated calculation between cost price, profit margin and selling price (New Product)
  const handleNewCostChange = (valStr: string) => {
    setNewItemCostPrice(valStr);
    const cost = parseFloat(valStr);
    const margin = parseFloat(newItemProfitMargin);
    if (!isNaN(cost) && !isNaN(margin)) {
      const calculated = cost * (1 + margin / 100);
      setNewItemPrice(calculated.toFixed(2));
    }
  };

  const handleNewMarginChange = (valStr: string) => {
    setNewItemProfitMargin(valStr);
    const cost = parseFloat(newItemCostPrice);
    const margin = parseFloat(valStr);
    if (!isNaN(cost) && !isNaN(margin)) {
      const calculated = cost * (1 + margin / 100);
      setNewItemPrice(calculated.toFixed(2));
    }
  };

  const handleNewPriceChange = (valStr: string) => {
    setNewItemPrice(valStr);
    const cost = parseFloat(newItemCostPrice);
    const price = parseFloat(valStr);
    if (!isNaN(cost) && cost > 0 && !isNaN(price)) {
      const calculatedMargin = ((price - cost) / cost) * 100;
      setNewItemProfitMargin(calculatedMargin.toFixed(1));
    }
  };

  // Bi-directional automated calculation (Editing Product)
  const handleEditCostChange = (valStr: string) => {
    setEditItemCostPrice(valStr);
    const cost = parseFloat(valStr);
    const margin = parseFloat(editItemProfitMargin);
    if (!isNaN(cost) && !isNaN(margin)) {
      const calculated = cost * (1 + margin / 100);
      setEditItemPrice(calculated.toFixed(2));
    }
  };

  const handleEditMarginChange = (valStr: string) => {
    setEditItemProfitMargin(valStr);
    const cost = parseFloat(editItemCostPrice);
    const margin = parseFloat(valStr);
    if (!isNaN(cost) && !isNaN(margin)) {
      const calculated = cost * (1 + margin / 100);
      setEditItemPrice(calculated.toFixed(2));
    }
  };

  const handleEditPriceChange = (valStr: string) => {
    setEditItemPrice(valStr);
    const cost = parseFloat(editItemCostPrice);
    const price = parseFloat(valStr);
    if (!isNaN(cost) && cost > 0 && !isNaN(price)) {
      const calculatedMargin = ((price - cost) / cost) * 100;
      setEditItemProfitMargin(calculatedMargin.toFixed(1));
    }
  };

  const startEditing = (item: InventoryItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemDescription(item.description || "");
    setEditItemCategory(item.category);
    setEditItemPrice(item.price.toString());
    setEditItemCostPrice(item.costPrice?.toString() || "");
    setEditItemProfitMargin(item.profitMargin?.toString() || "");
    setEditItemQty(item.quantity.toString());
    setEditItemMinQty(item.minQuantity.toString());
    setEditItemImageUrl(item.imageUrl || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const isService = editItemCategory === "Serviços";
    if (!editItemName.trim() || !editItemPrice || (!isService && (!editItemQty || !editItemMinQty))) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const updatedItem: InventoryItem = {
      ...editingItem,
      name: editItemName.trim(),
      description: editItemDescription.trim() || undefined,
      category: editItemCategory,
      price: Math.max(0, parseFloat(editItemPrice) || 0),
      costPrice: editItemCostPrice ? Math.max(0, parseFloat(editItemCostPrice)) : undefined,
      profitMargin: editItemProfitMargin ? parseFloat(editItemProfitMargin) : undefined,
      quantity: isService ? 999999 : Math.max(0, parseInt(editItemQty) || 0),
      minQuantity: isService ? 0 : Math.max(0, parseInt(editItemMinQty) || 0),
      imageUrl: editItemImageUrl.trim() || undefined,
    };

    if (onEditItem) {
      onEditItem(updatedItem);
    }
    setEditingItem(null);
  };

  // Filter lists based on search, category and low stock criteria
  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "Todos" || item.category === categoryFilter;
    const matchesLowStockStatus = !initialFilterLowStock || item.quantity < item.minQuantity;
    return matchesSearch && matchesCategory && matchesLowStockStatus;
  });

  const categoriesList = ["Todos", "Artesanato", "Vestuário", "Serviços", "Alimentação", "Outro"];

  const generateUniqueCode = (): string => {
    const existingCodes = new Set(inventory.map((item) => item.code));
    let code = "";
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (existingCodes.has(code));
    return code;
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const isService = newItemCategory === "Serviços";
    if (!newItemName.trim() || !newItemPrice || (!isService && (!newItemQty || !newItemMinQty))) {
      alert("Por favor, preencha todos os campos do produto.");
      return;
    }

    const createdItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      code: generateUniqueCode(),
      name: newItemName.trim(),
      description: newItemDescription.trim() || undefined,
      price: Math.max(0, parseFloat(newItemPrice) || 0),
      costPrice: newItemCostPrice ? Math.max(0, parseFloat(newItemCostPrice)) : undefined,
      profitMargin: newItemProfitMargin ? parseFloat(newItemProfitMargin) : undefined,
      quantity: isService ? 999999 : Math.max(0, parseInt(newItemQty) || 0),
      minQuantity: isService ? 0 : Math.max(0, parseInt(newItemMinQty) || 0),
      category: newItemCategory,
      imageUrl: newItemImageUrl.trim() || undefined,
    };

    onAddItem(createdItem);
    
    // Reset Form
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemQty("");
    setNewItemMinQty("");
    setNewItemImageUrl("");
    setNewItemCostPrice("");
    setNewItemProfitMargin("");
    setIsAdding(false);
  };

  return (
    <div className="animate-fade-in space-y-6 text-left">
      
      {/* Page Title & Add New Action Trigger */}
      <section className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-2">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white bg-zinc-900 px-4 py-2 border-2 border-brand-dark rounded-xl inline-flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
            Controle de Estoque 📦
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 font-medium mt-1">
            Monitore a disponibilidade dos seus produtos e evite perder vendas.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-brand-orange hover:bg-brand-orange/95 text-brand-dark font-display font-extrabold text-sm px-5 h-11 border-2 border-brand-dark dark:border-zinc-750 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>ADICIONAR PRODUTO</span>
        </button>
      </section>

      {/* Adding Modal / Card Form */}
      {isAdding && (
        <div className="p-6 bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 rounded-xl shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-extrabold text-lg text-brand-primary dark:text-brand-yellow">Novo Lançamento no Catálogo</h3>
            <button onClick={() => setIsAdding(false)} className="text-brand-muted dark:text-zinc-400 font-bold text-sm cursor-pointer hover:underline">Cancelar</button>
          </div>
          <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">Nome do Produto</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ex: Cerâmica Linha Premium"
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">Categoria</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 rounded-lg font-sans text-sm bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 focus:outline-none focus:border-brand-orange w-full"
              >
                {categoriesList.filter(c => c !== "Todos").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 md:col-span-4">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">Descrição do Produto</label>
              <textarea
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Ex: Peça pintada à mão com acabamento esmaltado, excelente para decoração ou uso diário..."
                rows={2}
                className="p-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">Preço de Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newItemCostPrice}
                onChange={(e) => handleNewCostChange(e.target.value)}
                placeholder="Ex: 30.00"
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">Margem de Lucro (%)</label>
              <input
                type="number"
                step="0.1"
                min="-100"
                value={newItemProfitMargin}
                onChange={(e) => handleNewMarginChange(e.target.value)}
                placeholder="Ex: 50"
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-bold text-[#ea580c] dark:text-brand-yellow uppercase tracking-wider">Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newItemPrice}
                onChange={(e) => handleNewPriceChange(e.target.value)}
                placeholder="59.90"
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-[#ea580c] dark:text-orange-400 font-bold font-sans text-sm focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2 text-left">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">Foto do Produto (Fazer Upload da Galeria/Computador)</label>
              <div className="flex items-center gap-4 mt-1 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-850">
                {newItemImageUrl ? (
                  <div className="relative group shrink-0">
                    <img 
                      src={newItemImageUrl} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-xl border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setNewItemImageUrl("")}
                      className="absolute -top-1.5 -right-1.5 bg-red-650 hover:bg-red-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-brand-dark cursor-pointer"
                      title="Remover foto"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-400 bg-white dark:bg-zinc-800 flex items-center justify-center text-xl text-zinc-400 shrink-0">
                    🖼️
                  </div>
                )}
                <div className="flex-grow flex flex-col gap-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label 
                      htmlFor="product-image-upload"
                      className="inline-flex items-center justify-center gap-1.5 h-10 px-3 bg-[#fd8b00] hover:bg-[#ff9f26] text-brand-dark shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] border-2 border-brand-dark rounded-lg font-sans text-[11px] sm:text-xs font-black uppercase cursor-pointer select-none transition-all active:translate-y-0.5 text-center"
                    >
                      <span>📂 Galeria / Arquivo</span>
                    </label>
                    <label 
                      htmlFor="product-image-camera-upload"
                      className="inline-flex items-center justify-center gap-1.5 h-10 px-3 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] border-2 border-brand-dark rounded-lg font-sans text-[11px] sm:text-xs font-black uppercase cursor-pointer select-none transition-all active:translate-y-0.5 text-center"
                    >
                      <span>📷 Usar Câmera</span>
                    </label>
                  </div>
                  <input
                    type="file"
                    id="product-image-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          if (typeof reader.result === "string") {
                            const compressed = await compressImage(reader.result, 600, 600, 0.7);
                            setNewItemImageUrl(compressed);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <input
                    type="file"
                    id="product-image-camera-upload"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          if (typeof reader.result === "string") {
                            const compressed = await compressImage(reader.result, 600, 600, 0.7);
                            setNewItemImageUrl(compressed);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <p className="text-[9px] text-zinc-550 dark:text-zinc-400">As imagens são compactadas e salvas diretamente no seu estoque.</p>
                </div>
              </div>
            </div>

            {newItemCategory !== "Serviços" ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">Qtd. Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="20"
                    className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider" title="Estoque mínimo recomendado">Qtd. Mínima de Segurança</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemMinQty}
                    onChange={(e) => setNewItemMinQty(e.target.value)}
                    placeholder="5"
                    className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full h-10 bg-brand-yellow text-brand-dark font-display font-bold text-sm border-2 border-brand-dark dark:border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                  >
                    CADASTRAR PRODUTO
                  </button>
                </div>
              </>
            ) : (
              <div className="md:col-span-4 flex items-end mt-4">
                <button
                  type="submit"
                  className="w-full h-10 bg-brand-yellow text-brand-dark font-display font-bold text-sm border-2 border-brand-dark dark:border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  CADASTRAR SERVIÇO ✨
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Filter and Search Layout box */}
      <section className="bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-800 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input bar */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-zinc-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto por nome..."
            className="w-full h-10 pl-10 pr-4 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange transition-all placeholder:text-brand-muted/50 text-brand-dark dark:text-zinc-100"
          />
        </div>

        {/* Categories togglers filter */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`h-9 px-3 font-display font-medium text-xs border-2 rounded-lg cursor-pointer transition-all ${
                categoryFilter === cat
                  ? "bg-brand-yellow text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                  : "bg-white dark:bg-zinc-800 text-brand-muted dark:text-zinc-300 border-brand-gray dark:border-zinc-700 hover:border-brand-dark"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Active filters state warnings */}
      {initialFilterLowStock && (
        <div className="bg-red-50 dark:bg-red-950/20 border-2 border-brand-dark dark:border-zinc-800 rounded-xl p-3 flex justify-between items-center text-[#ba1a1a] dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-sans text-xs font-bold uppercase tracking-wider">
              Exibindo apenas itens com estoque crítico ou abaixo do mínimo!
            </span>
          </div>
          <button
            onClick={onClearLowStockFilter}
            className="text-xs font-extrabold uppercase tracking-widest underline decoration-2 hover:text-[#901515] dark:hover:text-red-400 cursor-pointer"
          >
            Ver todos ({inventory.length})
          </button>
        </div>
      )}

      {/* Inventory Products Cards List */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isLowStock = item.quantity < item.minQuantity;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-zinc-900 border-2 rounded-xl p-4 flex flex-col justify-between min-h-[220px] h-auto transition-all relative ${
                  isLowStock
                    ? "border-[#ba1a1a] shadow-[4px_4px_0px_0px_rgba(186,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    : "border-brand-dark dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                }`}
              >
                {/* Upper row: name & status indicator */}
                <div className="text-left">
                  <div className="flex gap-3 justify-between items-start mb-1">
                    <div className="flex-grow min-w-0 text-left">
                      <h3 className="font-display font-black text-sm text-white bg-zinc-900 dark:bg-zinc-800 px-3 py-1.5 border-2 border-brand-dark rounded-lg inline-block max-w-full truncate pr-1 mb-1.5 shadow-[2.5px_2.5px_0px_0px_rgba(253,139,0,1)]" title={item.name}>
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="font-mono text-[10px] font-black bg-brand-yellow text-brand-dark border-2 border-brand-dark px-1.5 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)]">
                          CÓDIGO: #{item.code || "S/C"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="inline-block font-sans text-[10px] font-bold text-brand-muted dark:text-zinc-400 shrink-0 selection:bg-brand-yellow px-2 py-0.5 rounded-full border border-brand-gray/50 dark:border-zinc-700 uppercase">
                          {item.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="px-2 py-0.5 text-[9px] font-extrabold uppercase font-sans tracking-wide bg-brand-yellow/20 text-brand-dark dark:text-zinc-300 border border-brand-dark/50 hover:bg-brand-orange hover:text-brand-dark hover:border-brand-dark rounded cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                          title="Editar Informações"
                        >
                          ✏️ Editar
                        </button>
                        {onDeleteItem && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja excluir o item "${item.name}"?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="px-2 py-0.5 text-[9px] font-extrabold uppercase font-sans tracking-wide bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900/65 hover:bg-red-200 dark:hover:bg-red-900/50 rounded cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                            title="Excluir Item"
                          >
                            🗑️ Excluir
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Photo thumbnail with beautiful fallback */}
                    <div className="shrink-0">
                      <img
                        src={item.imageUrl || "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=200"}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200";
                        }}
                        className="w-12 h-12 object-cover border-2 border-brand-dark dark:border-zinc-700 rounded-lg bg-brand-gray shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Status alert detail bubble */}
                  {item.category === "Serviços" ? (
                    <div className="inline-flex items-center gap-1 bg-[#fff8e1] dark:bg-amber-950/45 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-900 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-1 select-none">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Serviço Ativo</span>
                    </div>
                  ) : isLowStock ? (
                    <div className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/45 text-[#ba1a1a] dark:text-red-300 border border-red-300 dark:border-red-900 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-1 select-none">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>REPOR ESTOQUE (Crítico)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-950/45 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-900 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-1 select-none">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Estoque Seguro</span>
                    </div>
                  )}

                  {item.description && (
                    <p className="font-sans text-xs text-brand-muted dark:text-zinc-400 mt-2 line-clamp-2 italic bg-zinc-50 dark:bg-zinc-850/45 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                      {item.description}
                    </p>
                  )}
                </div>
 
                {/* Price Label */}
                <div className="text-left mt-2 flex flex-col">
                  <span className="font-display font-extrabold text-lg text-brand-dark dark:text-zinc-200">
                    R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 font-mono text-[10px] font-bold text-brand-muted dark:text-zinc-400">
                    {item.costPrice !== undefined && item.costPrice > 0 && (
                      <span>Custo: R$ {item.costPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    )}
                    {item.profitMargin !== undefined && (
                      <span className="text-[#ea580c] dark:text-orange-400">Margem: {item.profitMargin.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
 
                {/* Lower Row: Stock adjustment controls or Unlimited Service Indicator */}
                {item.category === "Serviços" ? (
                  <div className="flex justify-between items-center border-t border-brand-gray/40 dark:border-zinc-800 pt-3 mt-2">
                    <span className="font-sans text-xs font-bold text-amber-600 dark:text-amber-400">
                      Disponibilidade ilimitada (Serviço)
                    </span>
                    <span className="font-mono text-[10px] font-extrabold bg-[#fff8e1] dark:bg-amber-950/45 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900 px-2 py-0.5 rounded shadow-sm">
                      ATIVO ✨
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center border-t border-brand-gray/40 dark:border-zinc-800 pt-3 mt-2">
                    <span className="font-sans text-xs font-bold text-brand-muted dark:text-zinc-400">
                      Min: {item.minQuantity} | <strong className={`font-extrabold ${isLowStock ? 'text-[#ba1a1a] dark:text-red-400' : 'text-brand-dark dark:text-zinc-200'}`}>Estoque: {item.quantity}</strong>
                    </span>

                    <div className="flex items-center gap-1.5 border border-brand-dark dark:border-zinc-700 rounded-lg p-0.5 bg-[#f9f9f9] dark:bg-zinc-800">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-7 h-7 bg-white dark:bg-zinc-900 border border-brand-gray dark:border-zinc-700 rounded flex items-center justify-center hover:bg-brand-yellow dark:hover:bg-brand-orange active:scale-95 transition-all text-brand-dark dark:text-zinc-100 cursor-pointer shadow-sm"
                        title="Subtrair 1 item"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-display font-extrabold text-sm text-brand-dark dark:text-zinc-100">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 bg-white dark:bg-zinc-900 border border-brand-gray dark:border-zinc-700 rounded flex items-center justify-center hover:bg-brand-yellow dark:hover:bg-brand-orange active:scale-95 transition-all text-brand-dark dark:text-zinc-100 cursor-pointer shadow-sm"
                        title="Adicionar 1 item"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-brand-muted/40 dark:border-zinc-700 rounded-xl">
            <Package className="w-12 h-12 mx-auto text-brand-muted/50 dark:text-zinc-500 mb-3" />
            <h3 className="font-display font-extrabold text-lg text-brand-dark dark:text-zinc-200">Nenhum produto encontrado</h3>
            <p className="font-sans text-sm text-brand-muted dark:text-zinc-400 mt-1 font-medium"> Tente redefinir seus filtros ou cadastrar novos itens.</p>
          </div>
        )}
      </section>

      {/* Editing Modal / Card Form overlay */}
      {editingItem && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left overflow-hidden">
          <div className="bg-[#f9f9f9] dark:bg-zinc-900 border-3 border-brand-dark dark:border-zinc-850 rounded-2xl p-6 w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] animate-scale-in flex flex-col max-h-[92vh] md:max-h-[88vh]">
            <div className="flex justify-between items-center pb-4 border-b-2 border-brand-dark dark:border-zinc-850 mb-4 shrink-0">
              <h3 className="font-display font-black text-lg text-brand-primary dark:text-brand-yellow uppercase tracking-wider">Editar Produto 📦</h3>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-brand-muted dark:text-zinc-400 font-extrabold hover:underline cursor-pointer text-xs uppercase"
              >
                ✕ Cancelar
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable form fields wrapper */}
              <div className="flex-1 overflow-y-auto pr-1.5 pb-2 min-h-0 scrollbar-thin grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Nome do Produto</label>
                  <input
                    type="text"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="h-11 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-850 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Categoria</label>
                  <select
                    value={editItemCategory}
                    onChange={(e) => setEditItemCategory(e.target.value)}
                    className="h-11 px-3 border-2 border-brand-dark dark:border-zinc-700 rounded-lg font-sans text-sm bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 focus:outline-none"
                  >
                    {categoriesList.filter(c => c !== "Todos").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Descrição do Produto</label>
                  <textarea
                    value={editItemDescription}
                    onChange={(e) => setEditItemDescription(e.target.value)}
                    placeholder="Ex: Peça pintada à mão com acabamento esmaltado, excelente para decoração ou uso diário..."
                    rows={2}
                    className="p-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-850 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editItemCostPrice}
                    onChange={(e) => handleEditCostChange(e.target.value)}
                    placeholder="Ex: 30.00"
                    className="h-11 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Margem de Lucro (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-100"
                    value={editItemProfitMargin}
                    onChange={(e) => handleEditMarginChange(e.target.value)}
                    placeholder="Ex: 50"
                    className="h-11 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-bold text-[#ea580c] dark:text-brand-yellow uppercase tracking-widest">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editItemPrice}
                    onChange={(e) => handleEditPriceChange(e.target.value)}
                    placeholder="Ex: 45.00"
                    className="h-11 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#ea580c] dark:text-orange-400 rounded-lg font-sans text-sm focus:outline-none font-bold"
                    required
                  />
                </div>

                {editItemCategory !== "Serviços" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Estoque Atual</label>
                      <input
                        type="number"
                        min="0"
                        value={editItemQty}
                        onChange={(e) => setEditItemQty(e.target.value)}
                        className="h-11 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Estoque Mínimo</label>
                      <input
                        type="number"
                        min="0"
                        value={editItemMinQty}
                        onChange={(e) => setEditItemMinQty(e.target.value)}
                        className="h-11 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1 sm:col-span-2 text-left">
                  <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-widest">Foto do Produto (Substituir/Upload)</label>
                  <div className="flex items-center gap-4 mt-1 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-850">
                    {editItemImageUrl ? (
                      <div className="relative group shrink-0">
                        <img 
                          src={editItemImageUrl} 
                          alt="Preview" 
                          className="w-14 h-14 object-cover rounded-lg border-2 border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] bg-white animate-fade-in"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setEditItemImageUrl("")}
                          className="absolute -top-1.5 -right-1.5 bg-red-650 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-brand-dark cursor-pointer shadow-md"
                          title="Remover foto"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg border-2 border-dashed border-zinc-400 bg-white dark:bg-zinc-800 flex items-center justify-center text-lg text-zinc-400 shrink-0 select-none">
                        🖼️
                      </div>
                    )}
                    <div className="flex-grow flex flex-col gap-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label 
                          htmlFor="product-image-edit-upload"
                          className="inline-flex items-center justify-center gap-1 h-9 px-2 bg-[#fd8b00] hover:bg-[#ff9f26] text-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] border-2 border-brand-dark rounded-lg font-sans text-[9px] font-black uppercase cursor-pointer select-none transition-all text-center"
                        >
                          <span>📂 Galeria</span>
                        </label>
                        <label 
                          htmlFor="product-image-edit-camera"
                          className="inline-flex items-center justify-center gap-1 h-9 px-2 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] border-2 border-brand-dark rounded-lg font-sans text-[9px] font-black uppercase cursor-pointer select-none transition-all text-center"
                        >
                          <span>📷 Câmera</span>
                        </label>
                      </div>
                      <input
                        type="file"
                        id="product-image-edit-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              if (typeof reader.result === "string") {
                                const compressed = await compressImage(reader.result, 600, 600, 0.7);
                                setEditItemImageUrl(compressed);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <input
                        type="file"
                        id="product-image-edit-camera"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              if (typeof reader.result === "string") {
                                const compressed = await compressImage(reader.result, 600, 600, 0.7);
                                setEditItemImageUrl(compressed);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t-2 border-brand-dark/20 dark:border-zinc-800 shrink-0 bg-[#f9f9f9] dark:bg-zinc-900">
                {onDeleteItem && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir o item "${editingItem.name}"?`)) {
                        onDeleteItem(editingItem.id);
                        setEditingItem(null);
                      }
                    }}
                    className="h-11 px-4 bg-red-100 dark:bg-red-950/45 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-900 rounded-lg font-display font-extrabold text-xs transition-all cursor-pointer uppercase tracking-wide hover:bg-red-200 dark:hover:bg-red-900/60 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    🗑️ EXCLUIR PRODUTO
                  </button>
                )}
                <div className="flex-grow flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 h-11 bg-white dark:bg-zinc-800 border-2 border-brand-gray dark:border-zinc-700 text-brand-muted hover:text-brand-dark dark:hover:text-zinc-100 font-display font-bold text-xs rounded-lg transition-all cursor-pointer uppercase tracking-wide"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-brand-orange text-brand-dark font-display font-extrabold text-xs tracking-wider border-2 border-brand-dark rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer uppercase"
                  >
                    SALVAR ALTERAÇÕES
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
