import React, { useState, useEffect, useRef } from "react";
import { X, Check, ShoppingBag, Plus, Minus, DollarSign, GripHorizontal } from "lucide-react";
import { motion, useDragControls } from "motion/react";
import { InventoryItem, Sale, Client } from "../types";

interface NewSaleModalProps {
  inventory: InventoryItem[];
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onAddSale: (sale: Sale) => void;
}

export default function NewSaleModal({ inventory, clients = [], isOpen, onClose, onAddSale }: NewSaleModalProps) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = inventory.find(item => item.id === selectedItemId);
  const dragControls = useDragControls();

  // State variables for dynamic discount calculations and comments/descriptions
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [overrideFinalValue, setOverrideFinalValue] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState("");

  const baseUnitPrice = customPrice !== "" ? parseFloat(customPrice) || 0 : (selectedItem ? selectedItem.price : 0);
  const rawTotal = baseUnitPrice * quantity;

  // Sync SearchTerm with selected item when opened, and reset discount states
  useEffect(() => {
    if (!isOpen) return;
    setDiscountPercent("");
    setDiscountValue("");
    setOverrideFinalValue(rawTotal > 0 ? rawTotal.toFixed(2) : "");
    setShowDescription(false);
    setDescription("");

    if (selectedItemId) {
      const item = inventory.find(i => i.id === selectedItemId);
      if (item) {
        setSearchTerm(`${item.name} (#${item.code || ""})`);
      }
    } else if (inventory.length > 0) {
      const first = inventory[0];
      setSelectedItemId(first.id);
      setSearchTerm(`${first.name} (#${first.code || ""})`);
    }
  }, [isOpen, selectedItemId, inventory]);

  // Reactively update fields when rawTotal changes (e.g. quantity or custom price modified)
  // Ensures discounts are only given when user actively typed in the fields.
  useEffect(() => {
    if (!isOpen) return;
    
    if (discountPercent !== "") {
      const pct = parseFloat(discountPercent);
      if (!isNaN(pct) && pct >= 0) {
        const amt = (pct / 100) * rawTotal;
        setDiscountValue(amt > 0 ? amt.toFixed(2) : "");
        setOverrideFinalValue((rawTotal - amt).toFixed(2));
        return;
      }
    }
    
    if (discountValue !== "") {
      const amt = parseFloat(discountValue);
      if (!isNaN(amt) && amt >= 0 && rawTotal > 0) {
        setOverrideFinalValue((rawTotal - amt).toFixed(2));
        return;
      }
    }
    
    setOverrideFinalValue(rawTotal > 0 ? rawTotal.toFixed(2) : "");
  }, [rawTotal, isOpen]);

  const handlePercentChange = (valStr: string) => {
    setDiscountPercent(valStr);
    if (valStr === "") {
      setDiscountValue("");
      setOverrideFinalValue(rawTotal > 0 ? rawTotal.toFixed(2) : "");
      return;
    }
    const pct = parseFloat(valStr);
    if (!isNaN(pct) && pct >= 0) {
      const amt = (pct / 100) * rawTotal;
      setDiscountValue(amt > 0 ? amt.toFixed(2) : "0.00");
      setOverrideFinalValue((rawTotal - amt).toFixed(2));
    }
  };

  const handleValueChange = (valStr: string) => {
    setDiscountValue(valStr);
    if (valStr === "") {
      setDiscountPercent("");
      setOverrideFinalValue(rawTotal > 0 ? rawTotal.toFixed(2) : "");
      return;
    }
    const amt = parseFloat(valStr);
    if (!isNaN(amt) && amt >= 0 && rawTotal > 0) {
      const pct = (amt / rawTotal) * 100;
      setDiscountPercent(pct > 0 ? pct.toFixed(1) : "0.0");
      setOverrideFinalValue((rawTotal - amt).toFixed(2));
    }
  };

  const handleFinalValueChange = (valStr: string) => {
    setOverrideFinalValue(valStr);
    if (valStr === "") {
      setDiscountValue("");
      setDiscountPercent("");
      return;
    }
    const finalVal = parseFloat(valStr);
    if (!isNaN(finalVal) && finalVal >= 0) {
      const amt = Math.max(0, rawTotal - finalVal);
      setDiscountValue(amt > 0 ? amt.toFixed(2) : "0.00");
      const pct = rawTotal > 0 ? (amt / rawTotal) * 100 : 0;
      setDiscountPercent(pct > 0 ? pct.toFixed(1) : "0.0");
    }
  };

  // Click outside to collapse dropdown automatically and restore previous search term
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        if (selectedItem) {
          setSearchTerm(`${selectedItem.name} (#${selectedItem.code || ""})`);
        } else {
          setSearchTerm("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, selectedItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setErrorMsg("Por favor, selecione um produto.");
      return;
    }

    if (quantity <= 0) {
      setErrorMsg("A quantidade deve ser pelo menos 1 unidade.");
      return;
    }

    if (selectedItem.category !== "Serviços" && quantity > selectedItem.quantity && !allowNegativeStock) {
      setErrorMsg("Espere! A quantidade informada é superior ao estoque disponível. Marque a permissão abaixo para continuar.");
      return;
    }

    const unitPrice = customPrice !== "" ? parseFloat(customPrice) || 0 : selectedItem.price;
    const computedRawTotal = unitPrice * quantity;
    const finalAmount = overrideFinalValue !== "" ? Math.max(0, parseFloat(overrideFinalValue)) : computedRawTotal;

    // Get current time
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5); // HH:MM
    const dateStr = now.toISOString().split("T")[0]; // Use current real date for chronological flow

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const newSale: Sale = {
      id: `sale-user-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      amount: finalAmount,
      itemDescription: selectedItem.name,
      quantity: quantity,
      clientId: selectedClientId || undefined,
      clientName: selectedClient ? selectedClient.name : undefined,
      discountAmount: discountValue !== "" ? parseFloat(discountValue) || undefined : undefined,
      discountPercent: discountPercent !== "" ? parseFloat(discountPercent) || undefined : undefined,
      originalAmount: computedRawTotal,
      description: description.trim() !== "" ? description.trim() : undefined
    };

    onAddSale(newSale);
    onClose();
    
    // Reset state values
    setQuantity(1);
    setCustomPrice("");
    setSelectedClientId("");
    setDiscountPercent("");
    setDiscountValue("");
    setOverrideFinalValue("");
    setShowDescription(false);
    setDescription("");
    setErrorMsg("");
  };

  const handleSelectProduct = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setSearchTerm(`${item.name} (#${item.code || ""})`);
    setIsDropdownOpen(false);
    setQuantity(1);
    setCustomPrice("");
    setErrorMsg("");
  };

  // Filter products by typed search name or code
  const filteredProducts = inventory.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    
    // Allow exact match with current selected item as valid selection presentation
    if (selectedItem && `${selectedItem.name} (#${selectedItem.code || ""})`.toLowerCase().trim() === term) {
      return true;
    }
    
    const matchesName = item.name.toLowerCase().includes(term);
    const matchesCode = (item.code || "").toLowerCase().includes(term);
    return matchesName || matchesCode;
  });

  // Custom high contrast highlighting for product name matched segments in dropdown
  const highlightMatches = (text: string, query: string) => {
    if (!query) return <span className="text-white font-extrabold">{text}</span>;
    // Strip trailing codes from representation if typing to keep match clean
    const cleanQuery = query.toLowerCase().replace(/#\d{4}/, "").trim();
    if (!cleanQuery) return <span className="text-white font-extrabold">{text}</span>;

    const index = text.toLowerCase().indexOf(cleanQuery);
    if (index === -1) return <span className="text-zinc-300 font-bold">{text}</span>;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + cleanQuery.length);
    const after = text.substring(index + cleanQuery.length);
    
    return (
      <span className="text-zinc-300 font-bold">
        {before}
        <span className="text-white bg-orange-600 border border-brand-dark px-1.5 py-0.5 rounded font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
          {match}
        </span>
        {after}
      </span>
    );
  };

  // Custom high contrast highlight for 4 digit product code match inside dropdown
  const highlightCodeMatches = (code: string, query: string) => {
    if (!code) return null;
    const cleanQuery = query.toLowerCase().trim().replace(/.*#/, "");
    if (!cleanQuery) {
      return (
        <span className="font-mono text-xs font-black bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
          #{code}
        </span>
      );
    }
    
    const index = code.toLowerCase().indexOf(cleanQuery);
    if (index === -1) {
      return (
        <span className="font-mono text-[10px] font-black bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-750">
          #{code}
        </span>
      );
    }
    
    const before = code.substring(0, index);
    const match = code.substring(index, index + cleanQuery.length);
    const after = code.substring(index + cleanQuery.length);
    
    return (
      <span className="font-mono text-xs font-black bg-brand-yellow text-brand-dark px-2 py-0.5 rounded border-2 border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-0.5 shrink-0">
        #{before}
        <span className="bg-zinc-900 text-white px-1 rounded font-black">
          {match}
        </span>
        {after}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left overflow-hidden">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        className="w-full max-w-md bg-white border-2 border-brand-dark rounded-xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-6 relative flex flex-col max-h-[95vh] md:max-h-[90vh]"
      >
        
        {/* Grab and Move Header Handle */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="flex justify-between items-center mb-4 border-b border-brand-gray/40 pb-3 cursor-grab active:cursor-grabbing select-none shrink-0"
          title="Segure e arraste aqui para mover a janela"
        >
          <div className="flex items-center gap-2 text-brand-primary min-w-0 flex-1">
            <GripHorizontal className="w-5 h-5 text-zinc-400 shrink-0 cursor-grab active:cursor-grabbing" />
            <ShoppingBag className="w-5 h-5 text-brand-dark fill-brand-yellow shrink-0" />
            <h3 className="font-display font-extrabold text-[#fd8b00] text-lg uppercase tracking-wide truncate">
              Registrar Nova Venda
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-brand-gray hover:bg-brand-gray flex items-center justify-center text-brand-muted cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-brand-dark text-xs font-bold rounded shrink-0">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Scrollable form fields container */}
          <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 pb-4 min-h-0 scrollbar-thin">
            
            {/* Select Product Search with beautiful typing highlighted dropdown */}
            <div className="flex flex-col gap-1.5" ref={dropdownRef}>
              <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider">
                Escolher Produto do Estoque (Busque pelo Nome ou Código de 4 Dígitos)
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onFocus={() => {
                    setIsDropdownOpen(true);
                    if (selectedItem && searchTerm === `${selectedItem.name} (#${selectedItem.code || ""})`) {
                      setSearchTerm("");
                    }
                  }}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    // Auto-switch exact matching code immediately
                    const exactMatch = inventory.find(
                      (item) => item.code && item.code === e.target.value.trim()
                    );
                    if (exactMatch) {
                      setSelectedItemId(exactMatch.id);
                    }
                  }}
                  placeholder="Busque por Nome (ex: Vaso) ou Código (ex: 1002)"
                  className="w-full h-11 pl-3 pr-10 border-2 border-brand-dark rounded-lg bg-white font-sans text-sm font-bold focus:outline-none focus:border-[#fd8b00]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setIsDropdownOpen(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 font-extrabold text-sm"
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}

                {/* Typed items color highlighted selection list wrapper */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-zinc-900 border-2 border-brand-dark rounded-xl shadow-[5px_5px_0px_0px_rgba(26,28,28,1)] z-50 p-2 space-y-1.5 custom-scrollbar">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((item) => {
                        const isSelected = item.id === selectedItemId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectProduct(item)}
                            className={`w-full text-left p-2.5 rounded-lg border-2 flex justify-between items-center transition-all ${
                              isSelected
                                ? "bg-zinc-800 border-brand-yellow text-white shadow-[2px_2px_0px_0px_rgba(253,139,0,1)]"
                                : "bg-zinc-950 border-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300"
                            }`}
                          >
                            <div className="flex flex-col gap-1 min-w-0 flex-1 pr-2 text-left">
                              <div className="truncate">
                                {highlightMatches(item.name, searchTerm)}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {highlightCodeMatches(item.code || "", searchTerm)}
                                <span className="font-sans text-[9px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded uppercase">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="font-display font-black text-xs text-white block">
                                R$ {item.price.toFixed(2)}
                              </span>
                              <span className="font-sans text-[10px] font-bold text-zinc-400 block mt-0.5">
                                Estoque: {item.quantity} un
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-zinc-500 font-sans text-xs font-bold">
                        Nenhum produto cadastrado para "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Product Selector (Horizontal scroll bar of items) */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="font-sans font-extrabold text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-1 select-none">
                ⚡ Seleção Rápida (Toque no Produto para Escolher)
              </span>
              <div className="flex gap-2 pb-1 overflow-x-auto min-h-[48px] scrollbar-thin max-w-full">
                {inventory.map((item) => {
                  const isSelected = item.id === selectedItemId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectProduct(item)}
                      className={`flex-shrink-0 h-10 px-3.5 border-2 rounded-lg font-sans text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-zinc-900 border-brand-dark text-white shadow-[2px_2px_0px_0px_rgba(253,139,0,1)] scale-[0.98]"
                          : "bg-white border-zinc-300 hover:border-brand-dark text-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,0.06)]"
                      }`}
                    >
                      <span className="truncate max-w-[140px] uppercase tracking-wide">{item.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${isSelected ? "bg-zinc-800 text-brand-yellow font-black" : "bg-zinc-100 text-zinc-500"}`}>
                        R$ {item.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedItem && (
              <div className="space-y-2 col-span-full">
                {/* White item name in deep background */}
                <div className="text-white bg-zinc-900 border-2 border-brand-dark rounded-lg p-2.5 font-display font-extrabold text-sm text-center shadow-[3px_3px_0px_0px_rgba(253,139,0,1)] uppercase tracking-wide">
                  Produto Escolhido: {selectedItem.name}
                </div>
                
                {/* White item values in deep background */}
                <div className="p-3 bg-zinc-900 border-2 border-brand-dark rounded-lg flex justify-between items-center text-xs text-white">
                  <span className="font-sans font-semibold text-zinc-300">
                    Estoque:
                    <strong className={`font-black ml-1.5 px-1.5 py-0.5 rounded ${selectedItem.quantity === 0 ? "bg-red-700 text-white" : "bg-zinc-800 text-white border border-zinc-700"}`}>
                      {selectedItem.quantity} un
                    </strong>
                  </span>
                  <span className="font-sans font-semibold text-zinc-300">
                    Preço do Item: <strong className="font-black text-white bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">R$ {selectedItem.price.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Optional client linkage */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider">
                Associar Cliente (Opcional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-11 px-3 border-2 border-brand-dark rounded-lg bg-white text-brand-dark font-sans text-sm font-bold focus:outline-none focus:border-[#fd8b00]"
              >
                <option value="">Nenhum cliente (Venda Geral)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.cellphone})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional custom price overwrite */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider" title="Deixe vazio para usar o preço padrão de catálogo">
                Preço Unitário Especial (Vazio para preço padrão)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={selectedItem ? selectedItem.price.toFixed(2) : "0.00"}
                  className="w-full h-11 pl-9 pr-4 border-2 border-brand-dark rounded-lg font-sans text-sm focus:outline-none focus:border-[#fd8b00]"
                />
              </div>
            </div>

            {/* Adjust Quantities Row */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider">
                Quantidade Vendida
              </label>
              <div className="flex items-center gap-3 border-2 border-brand-dark rounded-lg p-1 bg-white max-w-[150px]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded bg-[#f9f9f9] border border-brand-gray flex items-center justify-center hover:bg-brand-yellow font-bold text-brand-dark cursor-pointer shadow-xs active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="flex-1 text-center font-display font-extrabold text-base text-brand-dark">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded bg-[#f9f9f9] border border-brand-gray flex items-center justify-center hover:bg-brand-yellow font-bold text-brand-dark cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Warn if stock is insufficient */}
            {selectedItem && selectedItem.category !== "Serviços" && quantity > selectedItem.quantity && (
              <div className="p-3 bg-red-50 border-2 border-[#ba1a1a] rounded-lg space-y-2 animate-fade-in">
                <p className="text-xs text-[#ba1a1a] font-bold">
                  ⚠️ Quantidade Superior ao Estoque!
                </p>
                <p className="text-[11px] text-[#ba1a1a] leading-relaxed font-semibold">
                  Você possui apenas {selectedItem.quantity} unidades em estoque, mas está tentando registrar uma venda de {quantity}.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => {
                      setAllowNegativeStock(e.target.checked);
                      if (e.target.checked) {
                        setErrorMsg("");
                      }
                    }}
                    className="w-4 h-4 accent-brand-orange rounded border-brand-dark border-2 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-brand-dark">Autorizar registro com estoque negativo</span>
                </label>
              </div>
            )}

            {/* Discount Section */}
            {selectedItem && (
              <div className="border-t border-brand-gray/30 pt-3 space-y-3">
                <h4 className="font-sans font-extrabold text-xs text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
                  🏷️ Aplicar Desconto (Opcional)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Desconto % */}
                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-bold text-[10px] text-brand-muted uppercase tracking-wider">
                      Desconto (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => handlePercentChange(e.target.value)}
                        placeholder="0"
                        className="w-full h-11 px-2.5 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold pointer-events-none">%</span>
                    </div>
                  </div>

                  {/* Valor a Descontar */}
                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-bold text-[10px] text-brand-muted uppercase tracking-wider">
                      Descontar (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold pointer-events-none">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountValue}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-11 pl-7 pr-2 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] font-bold"
                      />
                    </div>
                  </div>

                  {/* Valor Final */}
                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-bold text-[10px] text-brand-dark uppercase tracking-widest font-black">
                      Valor Final (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#fd8b00] text-xs font-black pointer-events-none">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={overrideFinalValue}
                        onChange={(e) => handleFinalValueChange(e.target.value)}
                        placeholder={rawTotal.toFixed(2)}
                        className="w-full h-11 pl-7 pr-2 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] font-black text-[#fd8b00]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Optional description / annotation block */}
            <div className="border-t border-brand-gray/30 pt-3 flex flex-col gap-1.5">
              <label className="font-sans font-extrabold text-xs text-brand-dark uppercase tracking-wider flex items-center gap-1.5 select-none">
                📝 Anotação / Observação da Venda <span className="text-[10px] text-zinc-400 font-normal lowercase tracking-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Digite aqui alguma observação específica desta venda (ex: embalagem especial, entrega agendada...)"
                rows={2}
                className="w-full p-2.5 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] bg-white text-brand-dark font-medium placeholder-zinc-400"
              />
            </div>

            {/* Total amount summary card */}
            {selectedItem && (
              <div className="bg-zinc-900 p-4 border-2 border-brand-dark rounded-xl text-center text-white shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
                <span className="font-sans font-bold text-xs text-zinc-400 uppercase tracking-wider block">Faturamento Total para esta transação</span>
                <div className="mt-2 flex flex-col items-center justify-center gap-1">
                  {discountValue !== "" && parseFloat(discountValue) > 0 && (
                    <span className="text-zinc-500 text-xs font-bold line-through">
                      R$ {rawTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className="font-display font-black text-2xl text-white inline-block animate-fade-in bg-zinc-800 border-2 border-brand-dark px-4 py-1 rounded-lg">
                    R$ {(overrideFinalValue !== "" ? parseFloat(overrideFinalValue) || 0 : rawTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  {discountValue !== "" && parseFloat(discountValue) > 0 && (
                    <span className="text-brand-yellow font-sans text-[10px] font-black uppercase tracking-wider mt-1">
                      Economia de R$ {parseFloat(discountValue).toFixed(2)} ({discountPercent}%)!
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons footer */}
          <div className="flex gap-3 pt-4 border-t border-brand-gray/40 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border-2 border-brand-dark text-brand-dark font-display font-bold text-sm rounded-lg hover:bg-brand-gray cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-11 bg-brand-orange text-brand-dark font-display font-bold text-sm border-2 border-brand-dark rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Finalizar Venda</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
