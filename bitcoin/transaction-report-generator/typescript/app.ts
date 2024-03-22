// Import necessary modules and functions
import * as fs from "fs-extra"; // Import the fs-extra module for file system operations
import { DateTime } from "luxon";
import { bb_getaddress } from "./blockbookMethods"; // Import the function to fetch address data
import { calculateVariables } from "./calculateVariables";
import { generateReportForAddress } from "./generateReport"; // Import the function to generate a report
import { CalculateVariablesOptions, Config } from "./interfaces";

////// USER INPUTS //////
// Define the Bitcoin address for which the report will be generated
const address = "3MqUP6G1daVS5YTD8fz3QgwjZortWwxXFd";

// Optional date range and time zone for the report
const config: Config = {
  // startDate: {
  //   year: 2024,
  //   month: 3, // Luxon uses 1-indexed months, (e.g., 1 = January, 2 = February)
  //   day: 18,
  // },
  // endDate: {
  //   year: 2024,
  //   month: 3, // Luxon uses 1-indexed months, (e.g., 1 = January, 2 = February)
  //   day: 18,
  // },
  // userTimezone: "America/New_York",
};
////// END OF USER INPUTS //////

// Determine the effective timezone (userTimezone if provided, otherwise default to system's local timezone)
const defaultTimezone = DateTime.local().zoneName;
const effectiveTimezone = config.userTimezone || defaultTimezone;

let options: CalculateVariablesOptions = { userTimezone: effectiveTimezone };

// Safely check and apply start date from config if specified
if (config.startDate) {
  options.startDate = DateTime.fromObject(
    {
      year: config.startDate.year,
      month: config.startDate.month,
      day: config.startDate.day,
    },
    { zone: config.userTimezone }
  );
}

// Safely check and apply end date from config if specified
if (config.endDate) {
  options.endDate = DateTime.fromObject(
    {
      year: config.endDate.year,
      month: config.endDate.month,
      day: config.endDate.day,
    },
    { zone: config.userTimezone }
  );
}

(async () => {
  // Fetch transaction data for the specified address
  const data = await bb_getaddress(address);

  const extendedData = await calculateVariables(data, options);

  // Generate a report based on the fetched data
  const [report, fileName] = generateReportForAddress(extendedData);

  // Write the generated report to a CSV file
  fs.writeFileSync(fileName, report);
  // Log a confirmation message indicating where the report has been saved
  console.log(`Report saved to ${fileName}`);
})();
