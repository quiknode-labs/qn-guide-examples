// src/App.tsx
import React, { useState } from "react";
import "./index.css";
import ReportForm from "./components/ReportForm";
import ResultTable from "./components/ResultTable";
import { bb_getaddress } from "./helpers/blockbookMethods.ts";
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

    console.log("Form Submitted with values:", {
      address,
      startDate,
      endDate,
      timezone,
    });

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

    bb_getaddress(address)
      .then((data) => {
        return calculateVariables(data, options);
      })
      .then((extendedData) => {
        setLoading(false);
        setReportData(extendedData);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <header className="bg-blue-200 text-xl text-center p-4">
        Bitcoin Transaction Report Generator by QuickNode
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
