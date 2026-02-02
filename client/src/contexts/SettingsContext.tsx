import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
    colourblindMode: boolean;
    setColourblindMode: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [colourblindMode, setColourblindModeState] = useState<boolean>(() => {
        const saved = localStorage.getItem('cw_colourblindMode');
        return saved === 'true';
    });

    const setColourblindMode = (enabled: boolean) => {
        setColourblindModeState(enabled);
        localStorage.setItem('cw_colourblindMode', String(enabled));
    };

    return (
        <SettingsContext.Provider value={{ colourblindMode, setColourblindMode }}>
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
