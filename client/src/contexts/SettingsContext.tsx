import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
    colorblindMode: boolean;
    setColorblindMode: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [colorblindMode, setColorblindModeState] = useState<boolean>(() => {
        const saved = localStorage.getItem('cw_colorblindMode');
        return saved === 'true';
    });

    const setColorblindMode = (enabled: boolean) => {
        setColorblindModeState(enabled);
        localStorage.setItem('cw_colorblindMode', String(enabled));
    };

    return (
        <SettingsContext.Provider value={{ colorblindMode, setColorblindMode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
