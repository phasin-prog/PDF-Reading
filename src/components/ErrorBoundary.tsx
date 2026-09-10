import React, { Component, PropsWithChildren } from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/** Last-resort crash screen — a render error must never blank the whole app. */
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crash caught by boundary:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--paper)] text-[var(--ink)]">
          <div className="max-w-sm w-full p-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-center">
            <h1 className="text-[15px] font-semibold">เกิดข้อผิดพลาด</h1>
            <p className="text-[13px] text-[var(--ink-2)] mt-1.5 font-mono break-words">
              {this.state.error.message || 'Unknown render error'}
            </p>
            <button
              onClick={this.handleReload}
              className="mt-4 w-full py-2 rounded-lg bg-[var(--ink)] text-[var(--paper)] text-sm font-medium cursor-pointer"
            >
              โหลดใหม่
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
