import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#22223b] via-[#4a4e69] to-[#22223b] p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-24 h-24 mx-auto mb-6 bg-error/20 rounded-full flex items-center justify-center"
                        >
                            <span className="text-6xl">⚠️</span>
                        </motion.div>
                        
                        <h1 className="text-4xl md:text-5xl font-black text-display text-white mb-4">
                            Oops! Something went wrong
                        </h1>
                        
                        <p className="text-lg text-white/70 mb-8">
                            Don't worry, this happens sometimes. Let's get you back in the game!
                        </p>

                        {this.state.error && (
                            <details className="mb-8 text-left">
                                <summary className="cursor-pointer text-white/50 hover:text-white/80 transition-colors mb-2">
                                    Technical details (for developers)
                                </summary>
                                <pre className="bg-black/30 p-4 rounded-xl overflow-auto text-xs text-white/60">
                                    {this.state.error.message}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={this.handleReset}
                            className="px-8 py-4 bg-linear-to-r from-color-blue to-color-purple text-white font-black text-lg rounded-2xl uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Reload Game
                        </motion.button>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
