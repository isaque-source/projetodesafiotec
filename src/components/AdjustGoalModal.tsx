import React, { useState } from "react";
import { X, Check, Target } from "lucide-react";
import { Goal } from "../types";

interface AdjustGoalModalProps {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGoal: (newTarget: number) => void;
}

export default function AdjustGoalModal({ goal, isOpen, onClose, onUpdateGoal }: AdjustGoalModalProps) {
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAmount <= 0) {
      alert("A meta de faturamento deve ser maior que zero.");
      return;
    }
    onUpdateGoal(targetAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left animate-fade-in">
      <div className="w-full max-w-sm bg-white border-2 border-brand-dark rounded-xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-6 overflow-hidden animate-slide-up">
        
        {/* Title row */}
        <div className="flex justify-between items-center mb-6 border-b border-brand-gray/40 pb-3">
          <div className="flex items-center gap-2 text-brand-primary">
            <Target className="w-6 h-6 text-brand-dark" />
            <h3 className="font-display font-extrabold text-[#fd8b00] text-lg uppercase tracking-wide">
              Ajustar Meta Comercial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-brand-gray hover:bg-brand-gray flex items-center justify-center text-brand-muted cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider">
              Novo Faturamento Alvo (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted font-extrabold text-lg">
                R$
              </span>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-12 pl-12 pr-4 font-display font-extrabold text-lg border-2 border-brand-dark rounded-lg focus:outline-none focus:border-[#fd8b00] focus:ring-4 focus:ring-brand-orange/20 text-brand-dark"
                required
              />
            </div>
            <p className="text-xs text-brand-muted italic mt-1 font-medium leading-normal">
              Ajustar a meta reconfigura todos os percentuais e indicadores gráficos na tela de Progresso instantaneamente!
            </p>
          </div>

          {/* Action Row */}
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
              <span>Salvar Meta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
