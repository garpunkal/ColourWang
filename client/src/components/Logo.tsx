import palette from '../../../config/palette.json';

export const Logo = () => {
    return (
        <>
            <div className="relative flex items-center justify-center shrink-0 overflow-visible card-fan mt-12 md:mt-22" aria-hidden="true">
                {palette.palette.map((color) => {
                    return (
                        <div
                            key={color.name}
                            className="bg-(--dynamic-color) card absolute bottom-0 w-8 h-12 md:w-16 md:h-24 rounded-xs border border-white/20 shadow-[0_2px_6px_rgba(0,0,0,0.5)] overflow-hidden animate-fan-reveal origin-[bottom_center]
                            after:content-[''] after:absolute after:inset-0 after:bg-linear-to-br after:from-transparent after:via-transparent after:via-40% after:to-white/25"
                            style={{ '--dynamic-color': color.hex } as React.CSSProperties}
                        ></div>
                    )
                })}
            </div>
            <div className="flex flex-col">
                <h1 className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 text-hero-logo text-display text-center drop-shadow-2xl w-full">
                    <span className="text-display-gradient w-full">ColourWang</span>
                </h1>
            </div>
        </>
    );
};
