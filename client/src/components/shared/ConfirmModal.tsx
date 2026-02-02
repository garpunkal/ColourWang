import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'default' | 'danger' | 'warning';
}

export function ConfirmModal({ 
    isOpen, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel', 
    onConfirm, 
    onCancel,
    variant = 'default'
}: ConfirmModalProps) {
    const variantStyles = {
        default: {
            confirmBtn: 'btn-primary',
            titleColor: 'text-color-blue'
        },
        danger: {
            confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
            titleColor: 'text-red-400'
        },
        warning: {
            confirmBtn: 'bg-orange-500 hover:bg-orange-600 text-white',
            titleColor: 'text-orange-400'
        }
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="relative w-full max-w-md pointer-events-auto">
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-3xl bg-white/5 blur-xl" />
                            
                            {/* Modal content */}
                            <div className="relative glass-card p-8 rounded-3xl border-white/10 shadow-2xl">
                                {/* Close button */}
                                <button
                                    onClick={onCancel}
                                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/80 transition-colors rounded-full hover:bg-white/10"
                                >
                                    <X size={20} />
                                </button>

                                {/* Title */}
                                <h3 className={`text-2xl font-black uppercase tracking-tight mb-4 ${styles.titleColor}`}>
                                    {title}
                                </h3>

                                {/* Message */}
                                <div className="text-white/80 mb-8 leading-relaxed whitespace-pre-line">
                                    {message}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onCancel}
                                        className="flex-1 py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                                    >
                                        {cancelText}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onConfirm}
                                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-colors ${styles.confirmBtn}`}
                                    >
                                        {confirmText}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}