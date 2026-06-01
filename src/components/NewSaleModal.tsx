import React, { useState } from "react";
import { X, Check, ShoppingBag, Plus, Minus, DollarSign } from "lucide-react";
import { InventoryItem, Sale } from "../types";

interface NewSaleModalProps {
  inventory: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onAddSale: (sale: Sale) => void;
}

export default function NewSaleModal({ inventory, isOpen, onClose, onAddSale }: NewSaleModalProps) {
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  if (!isOpen) return null;

  const selectedItem = inventory.find(item => item.id === selectedItemId);

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

    if (quantity > selectedItem.quantity && !allowNegativeStock) {
      setErrorMsg("Espere! A quantidade informada é superior ao estoque disponível. Marque a permissão abaixo para continuar.");
      return;
    }

    const unitPrice = customPrice !== "" ? parseFloat(customPrice) : selectedItem.price;
    const finalAmount = unitPrice * quantity;

    // Get current time
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5); // HH:MM
    const dateStr = "2026-05-27"; // Unified mock date

    const newSale: Sale = {
      id: `sale-user-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      amount: finalAmount,
      itemDescription: selectedItem.name,
      quantity: quantity
    };

    onAddSale(newSale);
    onClose();
    
    // Reset state values
    setQuantity(1);
    setCustomPrice("");
    setErrorMsg("");
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    setQuantity(1);
    setCustomPrice("");
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left">
      <div className="w-full max-w-md bg-white border-2 border-brand-dark rounded-xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-6 overflow-hidden animate-slide-up">
        
        {/* Header Title with close action */}
        <div className="flex justify-between items-center mb-6 border-b border-brand-gray/40 pb-3">
          <div className="flex items-center gap-2 text-brand-primary">
            <ShoppingBag className="w-6 h-6 text-brand-dark fill-brand-yellow" />
            <h3 className="font-display font-extrabold text-[#fd8b00] text-lg uppercase tracking-wide">
              Registrar Nova Venda
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-brand-gray hover:bg-brand-gray flex items-center justify-center text-brand-muted cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-brand-dark text-xs font-bold rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Product Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider">
              Escolher Produto do Estoque
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleSelectItem(e.target.value)}
              className="w-full h-11 px-3 border-2 border-brand-dark rounded-lg bg-white font-sans text-sm focus:outline-none focus:border-[#fd8b00]"
            >
              <option value="" disabled>-- Selecione um produto --</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (R$ {item.price.toFixed(0)} | Qtd: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="p-3 bg-brand-yellow/10 border border-brand-yellow rounded-lg flex justify-between items-center text-xs">
              <span className="font-sans font-medium text-brand-muted">
                Estoque atual disponível:
                <strong className={`font-bold ml-1 ${selectedItem.quantity === 0 ? "text-red-600" : "text-brand-dark"}`}>
                  {selectedItem.quantity} unidades
                </strong>
              </span>
              <span className="font-sans font-medium text-brand-muted">
                Preço Unitário: <strong className="font-bold text-brand-dark">R$ {selectedItem.price.toFixed(2)}</strong>
              </span>
            </div>
          )}

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
          {selectedItem && quantity > selectedItem.quantity && (
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

          {/* Total amount summary card */}
          {selectedItem && (
            <div className="bg-[#f9f9f9] p-4 border-2 border-brand-dark rounded-xl text-center">
              <span className="font-sans font-bold text-xs text-brand-muted uppercase tracking-wider block">Faturamento Total para esta transação</span>
              <span className="font-display font-extrabold text-2xl text-brand-dark inline-block mt-1 animate-fade-in">
                R$ {((customPrice !== "" ? parseFloat(customPrice) || 0 : selectedItem.price) * quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Action buttons footer */}
          <div className="flex gap-3 pt-4 border-t border-brand-gray/40">
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
              <span>Confirmar Venda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
