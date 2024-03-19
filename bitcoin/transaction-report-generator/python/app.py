import asyncio
from datetime import datetime
import aiofiles
from blockbook_methods import bb_getaddress  # Adjust the import path as needed
from calculate_variables import calculate_variables  # Adjust the import path as needed
from generate_reports import generate_report_for_address  # Adjust the import path as needed

# Define the Bitcoin address for which the report will be generated
address = "3MqUP6G1daVS5YTD8fz3QgwjZortWwxXFd"

# Optional date range and time zone for the report
config = {
    # 'start_date': datetime(2024, 3, 18),  # March 18, 2024
    # 'end_date': datetime(2024, 3, 18), # March 18, 2024
    # 'user_timezone': "America/New_York",
}

async def main():
    # Fetch transaction data for the specified address
    data = await bb_getaddress(address)

    # Calculate variables
    extended_data = await calculate_variables(data, config)

    # Generate a report based on the fetched data
    report, file_name = generate_report_for_address(extended_data)

    # Write the generated report to a CSV file asynchronously
    async with aiofiles.open(file_name, 'w') as file:
        await file.write(report)

    # Log a confirmation message indicating where the report has been saved
    print(f"Report saved to {file_name}")

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())