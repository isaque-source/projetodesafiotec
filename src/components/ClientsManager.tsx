import React, { useState, useEffect } from "react";
import { User, Plus, Search, Trash2, MessageSquare, Clock, DollarSign, Save, X, BadgeCent, Edit2, AlertTriangle } from "lucide-react";
import { Client } from "../types";

interface ClientsManagerProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onAddQuickSale: (clientId: string, amount: number) => void;
}

// Sub-component for individual real-time stopwatch to ensure performance optimization on second-based renders
function ClientChrono({ timestamp }: { timestamp?: number }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!timestamp) {
      setElapsed("Nenhuma compra registrada");
      return;
    }

    const calculateElapsed = () => {
      const now = Date.now();
      const diff = now - timestamp;

      if (diff < 0) {
        setElapsed("Agora mesmo");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n: number) => String(n).padStart(2, "0");

      if (days > 0) {
        return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
      }
      return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    };

    setElapsed(calculateElapsed() || "");

    const interval = setInterval(() => {
      setElapsed(calculateElapsed() || "");
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) {
    return (
      <span className="font-sans text-xs font-semibold text-brand-muted dark:text-zinc-400">
        Nenhuma compra ainda
      </span>
    );
  }

  return (
    <span className="font-mono text-sm font-black text-white bg-zinc-900 border-2 border-brand-dark px-2.5 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(253,139,0,1)] inline-flex items-center gap-1.5 shrink-0">
      <Clock className="w-4 h-4 text-brand-orange animate-pulse" />
      <span>{elapsed}</span>
    </span>
  );
}

export default function ClientsManager({
  clients = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddQuickSale,
}: ClientsManagerProps) {
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [initialAmount, setInitialAmount] = useState("");

  // Quick sale logger inline state
  const [activeQuickSaleId, setActiveQuickSaleId] = useState<string | null>(null);
  const [quickSaleAmount, setQuickSaleAmount] = useState("");

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.cellphone.replace(/\D/g, "").includes(term)
    );
  });

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cellphone.trim()) {
      alert("Por favor, preencha o nome e o celular do cliente.");
      return;
    }

    // Clean Phone Mask or format
    const cleanPhone = cellphone.replace(/[^\d()-\s]/g, "");

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      cellphone: cleanPhone,
    };

    // If an initial purchase quantity/amount is provided
    const amt = parseFloat(initialAmount);
    if (!isNaN(amt) && amt > 0) {
      newClient.lastPurchaseAmount = amt;
      newClient.lastPurchaseTimestamp = Date.now();
      const now = new Date();
      newClient.lastPurchaseDate = now.toISOString().split("T")[0];
      newClient.lastPurchaseTime = now.toTimeString().substring(0, 5);
    }

    onAddClient(newClient);

    // Reset Form
    setName("");
    setCellphone("");
    setInitialAmount("");
    setIsAdding(false);
  };

  const handleStartEdit = (client: Client) => {
    setEditingClient(client);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name.trim() || !editingClient.cellphone.trim()) {
      alert("Por favor, informe um nome e telefone válidos.");
      return;
    }
    onUpdateClient(editingClient);
    setEditingClient(null);
  };

  const handleQuickSaleSubmit = (clientId: string) => {
    const amt = parseFloat(quickSaleAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert("Por favor, insira um valor de compra válido.");
      return;
    }

    onAddQuickSale(clientId, amt);
    setActiveQuickSaleId(null);
    setQuickSaleAmount("");
  };

  const formatWhatsAppLink = (phone: string) => {
    const rawNumber = phone.replace(/\D/g, "");
    // Check if country code is present, if not prep 55 (Brazil)
    const formattedNumber = rawNumber.length <= 11 ? `55${rawNumber}` : rawNumber;
    return `https://wa.me/${formattedNumber}`;
  };

  return (
    <div className="animate-fade-in space-y-6 text-left">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-2">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white bg-zinc-900 px-4 py-2 border-2 border-brand-dark rounded-xl inline-flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
            Gestão de Clientes 👥
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 font-medium mt-1">
            Cadastre seus clientes, acompanhe a última compra e monitore o tempo decorrido desde o último faturamento.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingClient(null);
          }}
          className="bg-brand-orange hover:bg-brand-orange/95 text-brand-dark font-display font-extrabold text-sm px-5 h-11 border-2 border-brand-dark dark:border-zinc-750 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>NOVO CLIENTE</span>
        </button>
      </section>

      {/* Register Client Form Component */}
      {isAdding && (
        <div className="p-6 bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 rounded-xl shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] animate-slide-up">
          <div className="flex justify-between items-center mb-4 border-b border-brand-gray/40 pb-2">
            <h3 className="font-display font-extrabold text-lg text-brand-primary dark:text-brand-yellow">
              Cadastrar Novo Cliente
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-brand-muted dark:text-zinc-400 font-bold text-sm cursor-pointer hover:underline"
            >
              Cancelar
            </button>
          </div>
          <form onSubmit={handleRegisterClient} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Oliveira"
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                Celular / WhatsApp (Com DDD)
              </label>
              <input
                type="text"
                value={cellphone}
                onChange={(e) => setCellphone(e.target.value.replace(/[a-zA-ZÀ-ÿ]/g, ""))}
                placeholder="Ex: 11999999999"
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 uppercase tracking-wider" title="Opcional. Valor da compra se o cliente estiver comprando agora.">
                Compra Inicial (R$ - Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="Ex: 45.90"
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="md:col-span-3 flex justify-end mt-2">
              <button
                type="submit"
                className="h-10 px-6 bg-brand-yellow text-brand-dark font-display font-black text-sm border-2 border-brand-dark rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                SALVAR CADASTRO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Client Form Component */}
      {editingClient && (
        <div className="p-6 bg-amber-50 dark:bg-zinc-900 border-2 border-brand-dark rounded-xl shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] animate-slide-up">
          <div className="flex justify-between items-center mb-4 border-b border-brand-gray/40 pb-2">
            <h3 className="font-display font-extrabold text-lg text-brand-dark dark:text-brand-yellow flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-brand-orange" />
              Editar Informações do Cliente
            </h3>
            <button
              onClick={() => setEditingClient(null)}
              className="text-brand-muted dark:text-zinc-400 font-bold text-xs hover:underline cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-black text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                Nome Completo
              </label>
              <input
                type="text"
                value={editingClient.name}
                onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-[#fd8b00]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-black text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                Celular / WhatsApp (Com DDD)
              </label>
              <input
                type="text"
                value={editingClient.cellphone}
                onChange={(e) => setEditingClient({ ...editingClient, cellphone: e.target.value.replace(/[a-zA-ZÀ-ÿ]/g, "") })}
                className="h-10 px-3 border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-[#fd8b00]"
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="h-10 px-4 border-2 border-brand-dark font-display font-bold text-xs rounded-lg hover:bg-brand-gray cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="h-10 px-6 bg-brand-orange text-brand-dark font-display font-black text-xs border-2 border-brand-dark rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                SALVAR ALTERAÇÕES
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search */}
      <section className="bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-800 rounded-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-zinc-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou celular..."
            className="w-full h-10 pl-10 pr-4 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-orange transition-all placeholder:text-brand-muted/50 text-brand-dark dark:text-zinc-100"
          />
        </div>
      </section>

      {/* Proactive Inactivity Warning Banner */}
      {(() => {
        const inactiveCount = clients.filter(c => {
          if (!c.lastPurchaseTimestamp) return false;
          const diff = (Date.now() - c.lastPurchaseTimestamp) / (1000 * 3600 * 24);
          return diff > 30;
        }).length;

        if (inactiveCount > 0) {
          return (
            <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 animate-pulse">
              <AlertTriangle className="w-5.5 h-5.5 shrink-0 text-red-650 mt-0.5" />
              <div className="text-left">
                <h4 className="font-sans font-extrabold text-xs text-brand-dark dark:text-zinc-100 uppercase tracking-wider block mb-0.5">⚠️ ALERTA DE INATIVIDADE</h4>
                <p className="font-sans text-[11px] text-zinc-650 dark:text-zinc-300 font-semibold leading-relaxed">
                  Atenção! Você possui <strong>{inactiveCount} {inactiveCount === 1 ? "cliente" : "clientes"}</strong> sem registrar nenhuma compra nos últimos <strong>30 dias</strong>. Clique no link do WhatsApp do cliente para entrar em contato e enviar novos descontos!
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Clients Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const hasPurchased = !!client.lastPurchaseTimestamp;
            const waLink = formatWhatsAppLink(client.cellphone);

            // Calculate active color alerts based on purchase status
            let borderClasses = "border-brand-dark dark:border-zinc-850 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]";
            let statusBadge = null;

            if (hasPurchased) {
              const diffDays = (Date.now() - (client.lastPurchaseTimestamp || 0)) / (1000 * 3600 * 24);
              if (diffDays <= 7) {
                borderClasses = "border-[#10b981] shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]";
                statusBadge = (
                  <span className="bg-green-150 text-green-700 dark:bg-green-950/40 dark:text-green-400 text-[10px] font-black border border-green-500 px-2 py-0.5 rounded uppercase font-sans">
                    ✨ Ativo
                  </span>
                );
              } else if (diffDays <= 30) {
                borderClasses = "border-[#f59e0b] shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]";
                statusBadge = (
                  <span className="bg-yellow-150 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 text-[10px] font-black border border-yellow-500 px-2 py-0.5 rounded uppercase font-sans">
                    ⚠️ Ausente
                  </span>
                );
              } else {
                borderClasses = "border-red-650 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]";
                statusBadge = (
                  <span className="bg-red-150 text-red-700 dark:bg-red-950/40 dark:text-red-450 text-[10px] font-black border border-red-500 px-2 py-0.5 rounded uppercase font-sans">
                    💤 Inativo
                  </span>
                );
              }
            } else {
              statusBadge = (
                <span className="bg-indigo-150 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-400 text-[10px] font-black border border-indigo-500 px-2 py-0.5 rounded uppercase font-sans">
                  🆕 Leads
                </span>
              );
            }

            return (
              <div
                key={client.id}
                className={`bg-white dark:bg-zinc-900 border-2 rounded-xl p-4 flex flex-col justify-between min-h-[240px] h-auto transition-all ${borderClasses}`}
              >
                <div>
                  {/* Top: Name & Badges */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1 text-left">
                      <h3 className="font-display font-extrabold text-brand-dark dark:text-zinc-100 text-base truncate">
                        {client.name}
                      </h3>
                      <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">
                        📞 {client.cellphone}
                      </p>
                    </div>
                    {statusBadge}
                  </div>

                  {/* WhatsApp shortcut button */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#128c7e] dark:text-[#25d366] border border-[#25d366]/40 rounded-lg px-2.5 py-1 text-xs font-black shadow-sm mb-4 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 fill-[#25d366]/25" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Last Purchase details and Stopwatch block */}
                  <div className="space-y-2 border-t border-brand-gray/40 dark:border-zinc-800 pt-3 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-sans font-bold text-brand-muted dark:text-zinc-400">
                        Última Compra:
                      </span>
                      {hasPurchased ? (
                        <span className="font-display font-extrabold text-brand-primary dark:text-brand-orange">
                          R$ {client.lastPurchaseAmount?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="font-sans text-brand-muted dark:text-zinc-500 italic">
                          Nunca
                        </span>
                      )}
                    </div>

                    {hasPurchased && client.lastPurchaseDate && (
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-405 font-medium">
                        Em: {new Date(client.lastPurchaseDate + 'T00:00:00').toLocaleDateString("pt-BR")} às {client.lastPurchaseTime}
                      </div>
                    )}

                    <div className="flex flex-col gap-1 pt-1">
                      <span className="font-sans text-[10px] font-black uppercase text-brand-muted dark:text-zinc-400 tracking-wider">
                        Tempo Corrido desde Última Compra:
                      </span>
                      <ClientChrono timestamp={client.lastPurchaseTimestamp} />
                    </div>

                    {hasPurchased && ((Date.now() - (client.lastPurchaseTimestamp || 0)) / (1000 * 3600 * 24) > 30) && (
                      <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-550 text-[#ba1a1a] dark:text-red-400 p-2 rounded-lg text-[10px] font-bold leading-normal flex items-start gap-1.5 mt-2.5 select-none animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-650" />
                        <span>ALERTA DE INATIVIDADE: Cliente sem compras há +30 dias!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Quick Sale or deletion */}
                <div className="border-t border-brand-gray/40 dark:border-zinc-800 pt-3 mt-4 flex flex-col gap-2">
                  {activeQuickSaleId === client.id ? (
                    <div className="flex items-center gap-2 animate-fade-in bg-zinc-50 dark:bg-zinc-850 p-2 rounded-lg border border-brand-dark">
                      <div className="relative flex-grow">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-zinc-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={quickSaleAmount}
                          onChange={(e) => setQuickSaleAmount(e.target.value)}
                          placeholder="Valor"
                          className="h-8 pl-6 pr-1 w-full border border-brand-dark rounded font-sans text-xs bg-white text-brand-dark focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleQuickSaleSubmit(client.id)}
                        className="bg-brand-orange hover:bg-brand-orange/90 text-brand-dark font-display font-extrabold text-[10px] h-8 px-2.5 rounded border border-brand-dark cursor-pointer shrink-0"
                      >
                        SALVAR
                      </button>
                      <button
                        onClick={() => {
                          setActiveQuickSaleId(null);
                          setQuickSaleAmount("");
                        }}
                        className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={() => setActiveQuickSaleId(client.id)}
                        className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark font-sans font-extrabold text-[10px] px-2.5 h-8 border-2 border-brand-dark rounded-md shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] flex items-center justify-center gap-1 cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        title="Registrar um faturamento rápido para este cliente"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>VENDA RÁPIDA</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(client)}
                          className="w-8 h-8 rounded border border-brand-gray text-brand-muted hover:text-brand-primary dark:hover:text-brand-yellow flex items-center justify-center cursor-pointer hover:bg-zinc-100 transition-colors"
                          title="Editar cadastro do cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o cadastro de ${client.name}?`)) {
                              onDeleteClient(client.id);
                            }
                          }}
                          className="w-8 h-8 rounded border border-brand-gray text-red-650 hover:text-red-750 flex items-center justify-center cursor-pointer hover:bg-red-50 transition-colors"
                          title="Excluir cadastro do cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-brand-muted/40 dark:border-zinc-700 rounded-xl">
            <User className="w-12 h-12 mx-auto text-brand-muted/50 dark:text-zinc-500 mb-3 animate-pulse" />
            <h3 className="font-display font-extrabold text-lg text-brand-dark dark:text-zinc-200">
              Nenhum cliente cadastrado
            </h3>
            <p className="font-sans text-sm text-brand-muted dark:text-zinc-400 mt-1 font-medium">
              Comece cadastrando seus parceiros e clientes no botão acima!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
