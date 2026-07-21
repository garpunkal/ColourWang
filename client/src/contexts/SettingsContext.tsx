import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SettingsContextType {
    colourblindMode: boolean;
    setColourblindMode: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [colourblindMode, setColourblindMode] = useState(false);

    return (
        <SettingsContext.Provider value={{ colourblindMode, setColourblindMode }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
