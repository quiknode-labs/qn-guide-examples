// src/App.tsx
import React, { useState } from "react";
import "./index.css";
import ReportForm from "./components/ReportForm.tsx";
import ResultTable from "./components/ResultTable.tsx";
import { bb_getAddress } from "./helpers/blockbookMethods.ts";
import { calculateVariables } from "./helpers/calculateVariables.ts";
import { ExtendedResult, CalculateVariablesOptions } from "./interfaces.ts";
import { DateTime } from "luxon";

const App = () => {
  const [reportData, setReportData] = useState<ExtendedResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFormSubmit = (
    address: string,
    startDate: string,
    endDate: string,
    timezone: string
  ) => {
    setLoading(true); // Start loading

    const configStartDate = DateTime.fromISO(startDate, {
      zone: timezone,
    });

    const configEndDate = DateTime.fromISO(endDate, {
      zone: timezone,
    });

    const options: CalculateVariablesOptions = {
      startDate: configStartDate,
      endDate: configEndDate,
      userTimezone: timezone,
    };

    bb_getAddress(address)
      .then((data) => {
        return calculateVariables(data, options);
      })
      .then((extendedData) => {
        setLoading(false);
        setReportData(extendedData);
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
      });
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <header className="bg-blue-200 text-xl text-center p-4">
        Ethereum Transaction Report Generator
      </header>
      <main className="flex-grow container mx-auto p-4">
        <ReportForm onSubmit={handleFormSubmit} isLoading={loading} />
        {reportData && <ResultTable data={reportData} />}
      </main>
      <footer className="bg-blue-200 text-center p-4">
        Created with ❤️ and{" "}
        <a href="https://www.quicknode.com" className="text-blue-500">
          QuickNode
        </a>
      </footer>
    </div>
  );
};

export default App;
