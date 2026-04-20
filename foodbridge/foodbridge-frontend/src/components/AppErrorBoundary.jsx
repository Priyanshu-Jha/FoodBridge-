import { Component } from 'react';

class AppErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        // Keep logging for debugging while showing a clean fallback to users.
        console.error('Unhandled UI error:', error);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
                    <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                        <h1 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h1>
                        <p className="text-sm text-slate-600 mb-5">
                            The page hit an unexpected issue. You can safely reload and continue.
                        </p>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
                        >
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
