import React, { useState } from "react";
import { viem } from "@quicknode/sdk";

interface AddressInputFormProps {
  onSubmit: (address: string) => void;
  setAddress: (address: string) => void;
  isLoading: boolean;
}

const AddressInputForm: React.FC<AddressInputFormProps> = ({
  onSubmit,
  setAddress,
  isLoading,
}) => {
  const [addressInput, setAddressInput] = useState("");
  const [isValidAddress, setIsValidAddress] = useState(false);

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const handleAddressChange = (e: any) => {
    const inputAddress = e.target.value;
    setAddressInput(inputAddress);
    setIsValidAddress(viem.isAddress(inputAddress));
    setAddress(inputAddress);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(addressInput);
  };

  return (
    <div className="flex justify-center mt-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-lg w-full max-w-md"
      >
        <input
          type="text"
          value={addressInput}
          onChange={handleAddressChange}
          placeholder="Enter Ethereum address"
          className="border p-2 w-full mb-4 rounded"
        />
        <button
          type="submit"
          disabled={!isValidAddress}
          className={`w-full py-2 rounded text-white ${
            isValidAddress
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-200 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Loading..." : "Generate"}
        </button>
      </form>
      
    </div>
  );
};

export default AddressInputForm;
