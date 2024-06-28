const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="bg-white/3 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full space-y-12 text-black">
            {children}
        </div>
    );
};

export default Container;