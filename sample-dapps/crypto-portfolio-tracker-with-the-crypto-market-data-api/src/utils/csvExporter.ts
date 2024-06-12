import { HistoricalDataEntry } from "../interfaces";

export const exportToCSV = (data: HistoricalDataEntry[], filename: string) => {
  const csvContent = [
    Object.keys(data[0]).join(","), // header row
    ...data.map((row) => Object.values(row).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
