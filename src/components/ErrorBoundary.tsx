import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 border-2 border-red-500 rounded-xl m-4 text-center max-w-md mx-auto shadow-md">
          <h2 className="text-lg font-bold text-red-700 font-display uppercase tracking-wider mb-2">
            ⚠️ Ocorreu um erro no sistema
          </h2>
          <p className="text-xs text-red-600 font-sans mb-4">
            Isso pode ter sido causado por dados inconsistentes no carrinho ou carregamento de produto.
          </p>
          <pre className="text-[10px] text-zinc-600 bg-white p-2 rounded border border-red-200 font-mono text-left max-h-32 overflow-auto mb-4">
            {this.state.error?.message || "Erro desconhecido"}
          </pre>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-zinc-950 text-white font-display font-black text-xs uppercase rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-zinc-950 font-display font-black text-xs uppercase rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
