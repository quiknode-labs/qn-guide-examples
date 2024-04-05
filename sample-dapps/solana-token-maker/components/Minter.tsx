import MetadataForm from "@/components/MetadataForm";
import Uploader from "@/components/Uploader";

const Minter = () => {
    return (
        <div className="bg-white/3 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full space-y-12">
            <Uploader />
            <MetadataForm />
        </div>
    )
};

export default Minter;