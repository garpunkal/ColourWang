

export const Logo = ({ className = "w-full h-auto" }: { className?: string }) => (
    <div className={`relative ${className} flex items-center justify-center select-none`}>
        {/* <motion.img
            src={logoImg}
            alt="ColourWang Logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="w-full h-auto drop-shadow-2xl"
        /> */}
        <h1>ColourWang</h1>
    </div>
);
