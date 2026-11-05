import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  /** O'zgarganda (boshqa sahifaga o'tilganda) xato holati tozalanadi */
  resetKey: string;
  children: ReactNode;
}

/** Sahifada xato bo'lsa, oq ekran o'rniga tushunarli xabar va "Yangilash" tugmasi. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page crashed", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-6 text-center">
        <p className="font-display text-3xl font-semibold text-ink">Sahifa ochilmadi</p>
        <p className="max-w-sm text-sm leading-relaxed text-ink/60">Sayt yangilangan bo'lishi mumkin. Sahifani yangilab ko'ring.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-ivory hover:bg-ink/85"
        >
          Yangilash
        </button>
      </div>
    );
  }
}
