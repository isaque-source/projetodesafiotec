import React, { useState, useEffect, useRef } from "react";
import { X, Check, ShoppingBag, Plus, Minus, DollarSign, GripHorizontal, Trash2, ShoppingCart, HelpCircle } from "lucide-react";
import { motion, useDragControls } from "motion/react";
import { InventoryItem, Sale, Client, SaleItem, Employee } from "../types";

interface NewSaleModalProps {
  inventory: InventoryItem[];
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onAddSale: (sale: Sale) => void;
  employees?: Employee[];
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  code?: string;
  category: string;
}

export default function NewSaleModal({ inventory = [], clients = [], isOpen, onClose, onAddSale, employees = [] }: NewSaleModalProps) {
  const [transactionType, setTransactionType] = useState<"sale" | "budget">("sale");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Dinheiro");
  const [installments, setInstallments] = useState<number>(1);
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>("");
  
  // Selection state for current product being searched / selected to add to cart
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  
  // Cart storage
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = inventory.find(item => item.id === selectedItemId);
  const dragControls = useDragControls();

  // Discount states
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [overrideFinalValue, setOverrideFinalValue] = useState("");
  
  const [description, setDescription] = useState("");

  // Calculate cart metrics
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Setup default selected product on opens
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset states
    setCart([]);
    setTransactionType("sale");
    setSelectedClientId("");
    setPaymentMethod("Dinheiro");
    setInstallments(1);
    setSelectedEmployeeEmail("");
    setQuantity(1);
    setCustomPrice("");
    setDiscountPercent("");
    setDiscountValue("");
    setOverrideFinalValue("");
    setDescription("");
    setErrorMsg("");
    setAllowNegativeStock(false);

    if (inventory.length > 0) {
      const first = inventory[0];
      setSelectedItemId(first.id);
      setSearchTerm(`${first.name} (#${first.code || ""})`);
    } else {
      setSelectedItemId("");
      setSearchTerm("");
    }
  }, [isOpen, inventory]);

  // Handle active selected item description updates when dropdown selects
  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(`${selectedItem.name} (#${selectedItem.code || ""})`);
    }
  }, [selectedItemId]);

  // Recalculate and update final totals based on cart total variations with discounts
  useEffect(() => {
    if (!isOpen) return;
    
    if (discountPercent !== "") {
      const pct = parseFloat(discountPercent);
      if (!isNaN(pct) && pct >= 0) {
        const amt = (pct / 100) * cartSubtotal;
        setDiscountValue(amt > 0 ? amt.toFixed(2) : "");
        setOverrideFinalValue((cartSubtotal - amt).toFixed(2));
        return;
      }
    }
    
    if (discountValue !== "") {
      const amt = parseFloat(discountValue);
      if (!isNaN(amt) && amt >= 0 && cartSubtotal > 0) {
        setOverrideFinalValue((cartSubtotal - amt).toFixed(2));
        return;
      }
    }
    
    setOverrideFinalValue(cartSubtotal > 0 ? cartSubtotal.toFixed(2) : "0.00");
  }, [cartSubtotal, discountPercent, discountValue, isOpen]);

  const handlePercentChange = (valStr: string) => {
    setDiscountPercent(valStr);
    if (valStr === "") {
      setDiscountValue("");
      setOverrideFinalValue(cartSubtotal > 0 ? cartSubtotal.toFixed(2) : "0.00");
      return;
    }
    const pct = parseFloat(valStr);
    if (!isNaN(pct) && pct >= 0) {
      const amt = (pct / 100) * cartSubtotal;
      setDiscountValue(amt > 0 ? amt.toFixed(2) : "0.00");
      setOverrideFinalValue((cartSubtotal - amt).toFixed(2));
    }
  };

  const handleValueChange = (valStr: string) => {
    setDiscountValue(valStr);
    if (valStr === "") {
      setDiscountPercent("");
      setOverrideFinalValue(cartSubtotal > 0 ? cartSubtotal.toFixed(2) : "0.00");
      return;
    }
    const amt = parseFloat(valStr);
    if (!isNaN(amt) && amt >= 0 && cartSubtotal > 0) {
      const pct = (amt / cartSubtotal) * 100;
      setDiscountPercent(pct > 0 ? pct.toFixed(1) : "0.0");
      setOverrideFinalValue((cartSubtotal - amt).toFixed(2));
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
      const amt = Math.max(0, cartSubtotal - finalVal);
      setDiscountValue(amt > 0 ? amt.toFixed(2) : "0.00");
      const pct = cartSubtotal > 0 ? (amt / cartSubtotal) * 100 : 0;
      setDiscountPercent(pct > 0 ? pct.toFixed(1) : "0.0");
    }
  };

  // Add Item to cart
  const handleAddToCart = () => {
    if (!selectedItem) {
      setErrorMsg("Por favor, selecione um produto válido.");
      return;
    }

    if (quantity <= 0) {
      setErrorMsg("A quantidade deve ser de pelo menos 1 unidade.");
      return;
    }

    // Verify stock constraints (only check if NOT a service AND not a budget)
    if (
      transactionType !== "budget" &&
      selectedItem.category !== "Serviços" && 
      !allowNegativeStock
    ) {
      // Aggregate current cart quantity to prevent double additions sneaking past stock limit
      const existingInCart = cart.find(i => i.id === selectedItemId);
      const totalRequested = (existingInCart ? existingInCart.quantity : 0) + quantity;
      
      if (totalRequested > selectedItem.quantity) {
        setErrorMsg(`Estoque insuficiente de "${selectedItem.name}". Estoque atual: ${selectedItem.quantity}. Habilite estoque negativo se necessário.`);
        return;
      }
    }

    const priceToUse = customPrice !== "" ? parseFloat(customPrice) || 0 : selectedItem.price;

    setCart(prev => {
      const exists = prev.find(item => item.id === selectedItemId);
      if (exists) {
        return prev.map(item => item.id === selectedItemId 
          ? { ...item, quantity: item.quantity + quantity, price: priceToUse } 
          : item
        );
      } else {
        return [...prev, {
          id: selectedItem.id,
          name: selectedItem.name,
          quantity: quantity,
          price: priceToUse,
          code: selectedItem.code,
          category: selectedItem.category
        }];
      }
    });

    setErrorMsg("");
    // Reset inputs for next selection
    setQuantity(1);
    setCustomPrice("");
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateCartItemQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    // Check stock boundaries
    const targetItem = inventory.find(i => i.id === itemId);
    if (
      transactionType !== "budget" &&
      targetItem && 
      targetItem.category !== "Serviços" && 
      !allowNegativeStock && 
      newQty > targetItem.quantity
    ) {
      setErrorMsg(`Não é possível aumentar a quantidade de "${targetItem.name}" além de seu limite de estoque de ${targetItem.quantity} un.`);
      return;
    }

    setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCart = [...cart];

    // Auto-cart logic: if the cart is complete empty, auto-add the selected item
    if (finalCart.length === 0) {
      if (!selectedItem) {
        setErrorMsg("Coloque pelo menos um produto no carrinho antes de salvar.");
        return;
      }

      if (quantity <= 0) {
        setErrorMsg("Insira uma quantidade válida para salvar.");
        return;
      }

      if (
        transactionType !== "budget" &&
        selectedItem.category !== "Serviços" && 
        quantity > selectedItem.quantity && 
        !allowNegativeStock
      ) {
        setErrorMsg(`Espere! O estoque de "${selectedItem.name}" é insuficiente. Ative estoque negativo ou ajuste a quantidade.`);
        return;
      }

      const priceToUse = customPrice !== "" ? parseFloat(customPrice) || 0 : selectedItem.price;
      finalCart = [{
        id: selectedItem.id,
        name: selectedItem.name,
        quantity: quantity,
        price: priceToUse,
        code: selectedItem.code,
        category: selectedItem.category
      }];
    }

    // Prepare description and amounts
    const finalSubtotal = finalCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const finalAmount = overrideFinalValue !== "" ? Math.max(0, parseFloat(overrideFinalValue)) : finalSubtotal;
    
    // Compile display itemDescription
    const itemsLabel = finalCart.map(i => `${i.name} (${i.quantity}x)`).join(", ");
    const totalQuantity = finalCart.reduce((acc, item) => acc + item.quantity, 0);

    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5); // HH:MM
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const saleItems: SaleItem[] = finalCart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      code: item.code
    }));

    // Find seller details
    const selectedEmployee = employees.find(
      e => e.email.toLowerCase().trim() === selectedEmployeeEmail.toLowerCase().trim()
    );

    // Validation: if employees are registered, a seller must be chosen
    if (employees && employees.length > 0 && !selectedEmployeeEmail) {
      setErrorMsg("Por favor, selecione qual vendedor realizou esta operação.");
      return;
    }

    const sellerEmail = selectedEmployee ? selectedEmployee.email : "owner";
    const sellerName = selectedEmployee ? selectedEmployee.name : "Dono (Admin)";

    const newSale: Sale = {
      id: `sale-user-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      amount: finalAmount,
      itemDescription: itemsLabel,
      quantity: totalQuantity,
      clientId: selectedClientId || undefined,
      clientName: selectedClient ? selectedClient.name : undefined,
      discountAmount: discountValue !== "" ? parseFloat(discountValue) || undefined : undefined,
      discountPercent: discountPercent !== "" ? parseFloat(discountPercent) || undefined : undefined,
      originalAmount: finalSubtotal,
      description: description.trim() !== "" ? description.trim() : undefined,
      type: transactionType,
      status: "completed",
      items: saleItems,
      paymentMethod: transactionType === "sale" ? paymentMethod : undefined,
      installments: (transactionType === "sale" && paymentMethod === "credito") ? installments : undefined,
      sellerEmail,
      sellerName
    };

    onAddSale(newSale);
    onClose();
  };

  // Click outside listener for the search dropdown
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        if (selectedItem) {
          setSearchTerm(`${selectedItem.name} (#${selectedItem.code || ""})`);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, selectedItem]);

  // Filter products matching search term query inputs
  const filteredProducts = inventory.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    if (selectedItem && `${selectedItem.name} (#${selectedItem.code || ""})`.toLowerCase().trim() === term) {
      return true;
    }
    const matchesName = item.name.toLowerCase().includes(term);
    const matchesCode = (item.code || "").toLowerCase().includes(term);
    return matchesName || matchesCode;
  });

  const highlightMatches = (text: string, query: string) => {
    if (!query) return <span className="text-white font-extrabold">{text}</span>;
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
        className="w-full max-w-lg bg-white border-2 border-brand-dark rounded-xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-6 relative flex flex-col max-h-[95vh] md:max-h-[90vh]"
      >
        {/* Grab and Move Header Handle */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="flex justify-between items-center mb-4 border-b border-brand-gray/40 pb-3 cursor-grab select-none shrink-0"
          title="Segure e arraste aqui para mover a janela"
        >
          <div className="flex items-center gap-2 text-brand-primary min-w-0 flex-1">
            <GripHorizontal className="w-5 h-5 text-zinc-400 shrink-0 cursor-grab active:cursor-grabbing" />
            <ShoppingBag className="w-5 h-5 text-brand-dark fill-brand-yellow shrink-0" />
            <h3 className="font-display font-extrabold text-[#fd8b00] text-lg uppercase tracking-wide truncate">
              {transactionType === "sale" ? "Registrar Nova Venda" : "Criar Orçamento de Itens"}
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

        {/* Transaction Type Choice Banner (Venda ou Orçamento) */}
        <div className="mb-4 flex bg-zinc-100 p-1 rounded-xl border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <button
            type="button"
            onClick={() => {
              setTransactionType("sale");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 font-display font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              transactionType === "sale"
                ? "bg-brand-orange text-brand-dark border-2 border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-extrabold"
                : "text-zinc-500 hover:text-brand-dark"
            }`}
          >
            🏷️ registrar venda
          </button>
          <button
            type="button"
            onClick={() => {
              setTransactionType("budget");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 font-display font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              transactionType === "budget"
                ? "bg-brand-yellow text-brand-dark border-2 border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-extrabold"
                : "text-zinc-500 hover:text-brand-dark"
            }`}
          >
            📋 criar orçamento
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-brand-dark text-xs font-bold rounded shrink-0 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4 min-h-0 scrollbar-thin">
            
            {/* SEARCH AND ADD TO CART PANEL */}
            <div className="p-4 bg-amber-500/5 rounded-xl border-2 border-dashed border-brand-dark space-y-3">
              <span className="font-display font-black text-[11px] text-zinc-900 uppercase tracking-widest block">
                ⚡ Passo 1: Adicionar Produtos ao Carrinho de Compras
              </span>

              {/* Product Select search bar */}
              <div className="flex flex-col gap-1.5" ref={dropdownRef}>
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
                      const exactMatch = inventory.find(
                        (item) => item.code && item.code === e.target.value.trim()
                      );
                      if (exactMatch) {
                        setSelectedItemId(exactMatch.id);
                      }
                    }}
                    placeholder="Nome do produto ou código de 4 dígitos..."
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
                    >
                      ✕
                    </button>
                  )}

                  {/* Dropdown list */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-zinc-900 border-2 border-brand-dark rounded-xl shadow-[5px_5px_0px_0px_rgba(26,28,28,1)] z-50 p-2 space-y-1.5 custom-scrollbar">
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

              {/* Selected product banner and pricing additions */}
              {selectedItem && (
                <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in">
                  <div className="col-span-2 text-white bg-zinc-900 border-2 border-brand-dark rounded-lg p-2 font-display font-bold text-xs text-center shadow-[2px_2px_0px_0px_rgba(253,139,0,1)] uppercase truncate">
                    🎯 selecionado: {selectedItem.name} 
                    {selectedItem.category !== "Serviços" ? ` (${selectedItem.quantity} un em estoque)` : " (Serviço)"}
                  </div>

                  {/* Quantity to sell */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-brand-dark uppercase">Quantidade</span>
                    <div className="flex items-center gap-2 border-2 border-brand-dark rounded-lg p-0.5 bg-white h-9">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 rounded bg-[#f5f5f5] hover:bg-brand-yellow flex items-center justify-center text-zinc-700 font-bold"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-display font-black text-xs">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-7 h-7 rounded bg-[#f5f5f5] hover:bg-brand-yellow flex items-center justify-center text-zinc-700 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Pricing Overwrites */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-brand-dark uppercase">Preço Especial (Opcional)</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder={selectedItem.price.toFixed(2)}
                        className="w-full h-9 pl-7 pr-2 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] bg-white text-zinc-800 font-bold"
                      />
                    </div>
                  </div>

                  {/* Stock overage check and negative auth checkbox */}
                  {transactionType !== "budget" && selectedItem.category !== "Serviços" && quantity > selectedItem.quantity && (
                    <div className="col-span-2 p-2 bg-red-100 border border-red-300 rounded-lg text-[11px] leading-tight space-y-1 flex flex-col">
                      <span className="text-red-700 font-bold">⚠️ Atenção: Menos estoque do que exigido!</span>
                      <label className="flex items-center gap-1.5 cursor-pointer mt-0.5">
                        <input
                          type="checkbox"
                          checked={allowNegativeStock}
                          onChange={(e) => setAllowNegativeStock(e.target.checked)}
                          className="w-3.5 h-3.5 accent-brand-orange border border-zinc-900 rounded"
                        />
                        <span className="font-bold text-zinc-800">Concordo vender mesmo sem estoque de segurança</span>
                      </label>
                    </div>
                  )}

                  {/* Add to list trigger button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="col-span-2 h-9 bg-zinc-900 text-white border-2 border-brand-dark font-display font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(253,139,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-yellow" />
                    <span>Adicionar Produto ao Carrinho de Compras</span>
                  </button>
                </div>
              )}
            </div>

            {/* SHOPPING CART OVERVIEW */}
            <div className="border-2 border-brand-dark rounded-xl p-4 bg-[#fbfbfb] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-[#fd8b00] text-xs uppercase tracking-wider flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  Produtos no Carrinho ({cart.length})
                </span>
                <span className="font-mono text-xs font-black bg-zinc-100 px-2 py-0.5 border border-zinc-300 rounded">
                  Subtotal: R$ {cartSubtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin pr-1 pb-1">
                  {cart.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border-2 border-brand-dark p-2 rounded-lg flex items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,0.04)]"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-brand-dark block truncate uppercase tracking-tight">{item.name}</span>
                        <span className="text-[10px] text-zinc-400 font-medium font-mono">
                          {item.code ? `#${item.code} • ` : ""}R$ {item.price.toFixed(2)}/un
                        </span>
                      </div>

                      {/* Quantity Incrementor */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-zinc-100 p-0.5 rounded border border-zinc-300 scale-95">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartItemQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white rounded border border-zinc-300 flex items-center justify-center hover:bg-brand-yellow text-zinc-600 font-bold font-mono"
                        >
                          -
                        </button>
                        <span className="font-display font-black text-xs w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartItemQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white rounded border border-zinc-300 flex items-center justify-center hover:bg-brand-yellow text-zinc-600 font-bold font-mono"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <span className="font-display font-black text-xs text-brand-dark">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="w-7 h-7 bg-red-100 border border-red-300 text-red-600 rounded flex items-center justify-center cursor-pointer hover:bg-red-200"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border-2 border-dotted border-zinc-300 rounded-lg text-center text-zinc-400 font-semibold text-[11px] leading-relaxed flex flex-col items-center gap-1">
                  <span>Seu carrinho está vazio.</span>
                  <span className="text-zinc-400 font-normal">Selecione e adicione produtos no passo 1 acima. Se você não adicionar nada e clicar em salvar, nós colocaremos automaticamente o item atualmente selecionado!</span>
                </div>
              )}
            </div>

            {/* ASSOCIATE CLIENT (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider">
                🏷️ Associar Cliente (Opcional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-11 px-3 border-2 border-brand-dark rounded-lg bg-white text-brand-dark font-sans text-sm font-bold focus:outline-none focus:border-[#fd8b00]"
              >
                <option value="">Nenhum cliente (Venda Geral / Balcão)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.cellphone})
                  </option>
                ))}
              </select>
            </div>

            {/* OFFERS / DISCOUNTS SECTION */}
            <div className="border-t border-brand-gray/30 pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-sans font-extrabold text-xs text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
                  🏷️ Aplicar Desconto Global no Faturamento
                </h4>
                {cartSubtotal === 0 && (
                  <span className="text-[10px] text-zinc-400 font-bold pointer-events-none italic uppercase">
                    Adicione itens ao carrinho para conceder desconto!
                  </span>
                )}
              </div>
              
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
                      disabled={cartSubtotal === 0}
                      value={discountPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                      placeholder="0"
                      className="w-full h-11 px-2.5 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] font-bold disabled:bg-zinc-50"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold pointer-events-none">%</span>
                  </div>
                </div>

                {/* Desconto R$ */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans font-bold text-[10px] text-brand-muted uppercase tracking-wider">
                    Desconto (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold pointer-events-none">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={cartSubtotal === 0}
                      value={discountValue}
                      onChange={(e) => handleValueChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 pl-7 pr-2 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] font-bold disabled:bg-zinc-50"
                    />
                  </div>
                </div>

                {/* Final Override */}
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
                      disabled={cartSubtotal === 0}
                      value={overrideFinalValue}
                      onChange={(e) => handleFinalValueChange(e.target.value)}
                      placeholder={cartSubtotal.toFixed(2)}
                      className="w-full h-11 pl-7 pr-2 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] font-black text-[#fd8b00] disabled:bg-zinc-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            {transactionType === "sale" && (
              <div className="border-t border-brand-gray/30 pt-3 flex flex-col gap-1.5">
                <label className="font-sans font-extrabold text-xs text-brand-dark uppercase tracking-wider flex items-center gap-1.5 select-none">
                  💵 Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "Dinheiro", name: "Dinheiro" },
                    { id: "pix", name: "Pix" },
                    { id: "credito", name: "Crédito" },
                    { id: "debito", name: "Débito" },
                    { id: "boleto", name: "Boleto" }
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`h-9 border-2 font-display font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#fd8b00] text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] translate-x-[1px] translate-y-[1px]"
                            : "bg-white hover:bg-zinc-50 text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] active:translate-y-[2px] active:shadow-none"
                        }`}
                      >
                        {method.name}
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === "credito" && (
                  <div className="mt-2.5 p-3 bg-zinc-50 dark:bg-zinc-850 border-2 border-brand-dark rounded-lg flex flex-col gap-1 sm:w-1/2">
                    <label className="font-sans font-bold text-[10px] text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                      Quantidade de Parcelas
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                      className="w-full h-9 px-2 border-2 border-brand-dark bg-white dark:bg-zinc-800 dark:text-white font-sans text-xs rounded-lg focus:outline-none focus:border-brand-orange font-bold text-brand-dark dark:text-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? "1x (À vista)" : `${n}x`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* SELLER / VENDEDOR SELECTION */}
            {employees && employees.length > 0 && (
              <div className="border-t border-brand-gray/30 pt-3 flex flex-col gap-1.5">
                <label className="font-sans font-extrabold text-xs text-[#fd8b00] uppercase tracking-wider flex items-center gap-1.5 select-none">
                  👤 Vendedor Responsável *
                </label>
                <select
                  value={selectedEmployeeEmail}
                  onChange={(e) => setSelectedEmployeeEmail(e.target.value)}
                  className="w-full h-11 px-3 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] bg-white text-brand-dark font-extrabold"
                  required
                >
                  <option value="">Selecione quem realizou a venda...</option>
                  <option value="owner">Dono / Proprietário (Você)</option>
                  {employees.map((emp) => (
                    <option key={emp.email} value={emp.email}>
                      {emp.name} ({emp.role || "Vendedor"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SALE COMMENTARY/DESCRIPTION */}
            <div className="border-t border-brand-gray/30 pt-3 flex flex-col gap-1.5">
              <label className="font-sans font-extrabold text-xs text-brand-dark uppercase tracking-wider flex items-center gap-1.5 select-none">
                📝 Notas / Observações Adicionais <span className="text-[10px] text-zinc-400 font-normal lowercase tracking-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exemplo: entregar no endereço, detalhes de customização, formas de parcelamento..."
                rows={2}
                className="w-full p-2.5 border-2 border-brand-dark rounded-lg font-sans text-xs focus:outline-none focus:border-[#fd8b00] bg-white text-brand-dark font-medium placeholder-zinc-400"
              />
            </div>

            {/* BILLING / BUDGET TOTAL SUMMARY */}
            <div className="bg-zinc-900 p-4 border-2 border-brand-dark rounded-xl text-center text-white shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
              <span className="font-sans font-bold text-xs text-zinc-400 uppercase tracking-wider block">
                {transactionType === "sale" ? "Faturamento Estimado da Venda" : "Valor do Orçamento Gerado"}
              </span>
              <div className="mt-2 flex flex-col items-center justify-center gap-1">
                {discountValue !== "" && parseFloat(discountValue) > 0 && (
                  <span className="text-zinc-500 text-xs font-bold line-through">
                    R$ {cartSubtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                )}
                <span className="font-display font-black text-2xl text-white inline-block animate-fade-in bg-zinc-800 border-2 border-brand-dark px-4 py-1 rounded-lg">
                  R$ {(overrideFinalValue !== "" ? parseFloat(overrideFinalValue) || 0 : cartSubtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                {discountValue !== "" && parseFloat(discountValue) > 0 && (
                  <span className="text-brand-yellow font-sans text-[10px] font-black uppercase tracking-wider mt-1">
                    Economia/Desconto de R$ {parseFloat(discountValue).toFixed(2)} ({discountPercent}%)!
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Action buttons footer */}
          <div className="flex gap-3 pt-4 border-t border-brand-gray/40 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border-2 border-brand-dark text-brand-dark font-display font-bold text-sm rounded-lg hover:bg-brand-gray cursor-pointer transition-colors"
            >
              Fechar Janela
            </button>
            <button
              type="submit"
              className={`flex-1 h-11 text-brand-dark font-display font-bold text-sm border-2 border-brand-dark rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 ${
                transactionType === "sale" ? "bg-brand-orange" : "bg-brand-yellow"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{transactionType === "sale" ? "Finalizar Venda" : "Salvar Orçamento"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
