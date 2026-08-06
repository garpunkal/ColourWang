import React from 'react';

interface RoundIntroScreenProps {
    roundNumber: number;
    title: string;
    description?: string;
}

export const RoundIntroScreen: React.FC<RoundIntroScreenProps> = ({ roundNumber, title, description }) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-900 text-white animate-fade-in p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-400 mb-6 uppercase tracking-widest">Round {roundNumber}</h2>
            <h1 className="text-5xl md:text-7xl font-black text-yellow-500 mb-10 text-center leading-tight">
                {title}
            </h1>
            {description && (
                <p className="text-2xl md:text-4xl text-gray-300 max-w-4xl text-center italic font-light">
                    "{description}"
                </p>
            )}
        </div>
    );
};
