// src/components/PortfolioInput.tsx
import React, { useState } from "react";
import { PortfolioInputProps } from "../interfaces";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const PortfolioInput: React.FC<PortfolioInputProps> = ({
  onAddHolding,
  assets,
  holdings,
  onUpdateHolding,
  onRemoveHolding,
}) => {
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [isEditing, setIsEditing] = useState<number | null>(null);

  const handleAddHolding = () => {
    if (asset && amount) {
      onAddHolding(asset, Number(amount));
      setAsset("");
      setAmount("");
    }
  };

  const handleUpdateHolding = (index: number) => {
    if (amount) {
      onUpdateHolding(index, Number(amount));
      setAsset("");
      setAmount("");
      setIsEditing(null);
    }
  };

  const handleRemoveHolding = (index: number) => {
    console.log("index", index);
    onRemoveHolding(index);
    setAsset("");
    setAmount("");
    setIsEditing(null);
  };

  const availableAssets = assets.filter(
    (asset) => !holdings.some((holding) => holding.asset === asset.asset_id)
  );

  return (
    <div className="flex space-x-4">
      <div className="w-1/2 my-4 p-4 border rounded-lg shadow-sm bg-white">
        <div className="flex flex-col space-y-2">
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="p-2 border rounded-md"
            disabled={isEditing !== null}
          >
            <option value="">Select Asset</option>
            {availableAssets.map((asset) => (
              <option key={asset.asset_id} value={asset.asset_id}>
                {asset.name} - ({asset.asset_id})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-2 border rounded-md"
          />
          {isEditing === null ? (
            <button
              onClick={handleAddHolding}
              className="bg-blue-600 text-white py-2 rounded-md"
            >
              Add Holding
            </button>
          ) : (
            <button
              onClick={() => handleUpdateHolding(isEditing)}
              className="bg-green-600 text-white py-2 rounded-md"
            >
              Update Holding
            </button>
          )}
        </div>
      </div>
      <div className="w-1/2 my-4 p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Your Portfolio</h2>
        <ul>
          {holdings.map((holding, index) => (
            <li key={index} className="flex justify-between items-center mb-2">
              <span>
                {holding.asset}: {holding.amount}
              </span>
              <div className="flex space-x-2">
                <EditIcon
                  className="cursor-pointer"
                  onClick={() => {
                    setIsEditing(index);
                    setAsset(holding.asset);
                    setAmount(holding.amount);
                  }}
                />
                <DeleteIcon
                  className="cursor-pointer"
                  onClick={() => handleRemoveHolding(index)}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PortfolioInput;
