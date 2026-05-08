import React, { Component, ErrorInfo, ReactNode } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class CosmicErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Cosmic Interference Detected:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[1000] bg-space-bg flex flex-col items-center justify-center p-8 text-center">
          <div className="absolute inset-0 star-field opacity-10" />
          
          <div className="relative">
            <div className="w-24 h-24 bg-taurus-gold/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
              <Sparkles className="w-12 h-12 text-taurus-gold opacity-50" />
            </div>
            <div className="absolute -inset-4 border border-taurus-gold/20 rounded-full animate-spin-slow opacity-30" />
          </div>

          <h1 className="text-4xl font-display italic text-light-gold mb-4 drop-shadow-glow">
            Cosmic Interference Detected
          </h1>
          
          <p className="max-w-md text-white/40 font-mono text-xs uppercase tracking-widest leading-relaxed mb-12">
            The celestial frequency has been interrupted. A planetary alignment error or technical solar flare has occurred. 
            <br /><br />
            <span className="text-taurus-gold/60">Code: {this.state.error?.name || "VOID_EXCEPTION"}</span>
          </p>

          <Button 
            onClick={() => window.location.reload()}
            className="bg-taurus-gold hover:bg-light-gold text-charcoal font-black uppercase tracking-widest px-10 py-6 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-align Frequencies
          </Button>

          <div className="mt-12 opacity-10">
             <div className="h-px w-64 bg-gradient-to-r from-transparent via-white to-transparent" />
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
