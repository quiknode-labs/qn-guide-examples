import { PortfolioHolding, HistoricalDataEntry } from "../interfaces";
import {
  fetchCurrentExchangeRates,
  fetchHistoricalExchangeRates,
} from "../services/cryptoAPI";
import { exportToCSV } from "./csvExporter";

export const addHolding = (
  holdings: PortfolioHolding[],
  asset: string,
  amount: number
) => {
  return [...holdings, { asset, amount }];
};

export const updateHolding = (
  holdings: PortfolioHolding[],
  index: number,
  amount: number
) => {
  const updatedHoldings = [...holdings];
  updatedHoldings[index].amount = amount;
  return updatedHoldings;
};

export const removeHolding = (holdings: PortfolioHolding[], index: number) => {
  return holdings.filter((_, i) => i !== index);
};

export const fetchPortfolioData = async (
  holdings: PortfolioHolding[],
  currency: string,
  timeInterval: string,
  limit: number,
  setHistoricalData: (data: HistoricalDataEntry[]) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);
    const now = new Date();
    const endDate = now.toISOString();
    const startDate = new Date(
      now.getTime() - limit * parseTimeInterval(timeInterval)
    ).toISOString();

    const historicalRates = await Promise.all(
      holdings.map((holding) =>
        fetchHistoricalExchangeRates(
          holding.asset,
          currency,
          timeInterval,
          startDate,
          endDate,
          limit
        )
      )
    );

    // Group historical data by date and include asset values
    const historicalDataMap: { [key: string]: HistoricalDataEntry } = {};

    historicalRates.forEach((rates, index) => {
      rates.forEach((rate) => {
        if (!historicalDataMap[rate.time_period_start]) {
          historicalDataMap[rate.time_period_start] = {
            date: rate.time_period_start,
          };
        }
        historicalDataMap[rate.time_period_start][holdings[index].asset] =
          rate.rate_close * holdings[index].amount;
      });
    });

    const historicalData: HistoricalDataEntry[] =
      Object.values(historicalDataMap);

    setHistoricalData(historicalData);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

export const fetchTotalPortfolioValue = async (
  holdings: PortfolioHolding[],
  currency: string,
  setExchangeRates: (rates: { [key: string]: number }) => void,
  setTotalValue: (value: number) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);

    const currentRates = await Promise.all(
      holdings.map((holding) =>
        fetchCurrentExchangeRates(holding.asset, currency)
      )
    );

    const exchangeRatesMap: { [key: string]: number } = {};
    currentRates.forEach((rate) => {
      exchangeRatesMap[`${rate.asset_id_base}-${rate.asset_id_quote}`] =
        rate.rate;
    });
    setExchangeRates(exchangeRatesMap);

    const totalValue = holdings.reduce((acc, holding) => {
      const rate = exchangeRatesMap[`${holding.asset}-${currency}`] || 0;
      return acc + holding.amount * rate;
    }, 0);

    setTotalValue(totalValue);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

// Handle CSV export
export const handleExportCSV = (historicalData: HistoricalDataEntry[]) => {
  exportToCSV(historicalData, "portfolio_value");
};

const parseTimeInterval = (interval: string) => {
  const [value, unit] = interval.match(/\d+|\D+/g)!;
  switch (unit) {
    case "DAY":
      return parseInt(value) * 24 * 60 * 60 * 1000;
    case "HRS":
      return parseInt(value) * 60 * 60 * 1000;
    case "MIN":
      return parseInt(value) * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
};
