// src/components/ReportForm.tsx
import React, { useState } from "react";

interface ReportFormProps {
  onSubmit: (
    address: string,
    startDate: string,
    endDate: string,
    timezone: string
  ) => void;
  isLoading: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, isLoading }) => {
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split("T")[0]
  ); // default to today's date
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  ); // default to today's date
  const [timezone, setTimezone] = useState("UTC");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(address, startDate, endDate, timezone);
  };


  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const timezones = (Intl as any).supportedValuesOf("timeZone") as string[];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="address" className="block">
          Bitcoin Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>
      <div className="flex space-x-3 ">
        <div>
          <label htmlFor="startDate" className="block">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="timezone" className="block">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="border p-2"
          >
            {timezones.map((timezones) => (
              <option key={timezones} value={timezones}>
                {timezones}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isLoading ? "Loading..." : "Generate"}
      </button>
    </form>
  );
};

export default ReportForm;
