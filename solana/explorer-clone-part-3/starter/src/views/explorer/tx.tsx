import { FC } from "react";
import { TransactionDetail } from "components/TransactionDetail";

export const TransactionView: FC = ( ) => {
  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Quick View Explorer
        </h1>
        <div className="text-center">
        </div>
        <div className="text-center">
            <TransactionDetail />
        </div>
      </div>
    </div>
  );
};