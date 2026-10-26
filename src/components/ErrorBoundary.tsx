import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Bot } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTab?: string;
  onResetToChat?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('InternMate UI ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center my-6 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Something went wrong rendering this view</h3>
          <p className="text-xs text-rose-200/80 mt-1 max-w-md">
            {this.state.error?.message || 'An unexpected runtime error occurred.'}
          </p>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Rendering</span>
            </button>

            {this.props.onResetToChat && (
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onResetToChat?.();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Return to AI Chatbot</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
