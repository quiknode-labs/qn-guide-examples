// src/services/cryptoAPI.ts
import axios from "axios";

const QUICKNODE_ENDPOINT = import.meta.env.VITE_QUICKNODE_ENDPOINT as string;

import { Asset, ExchangeRate, HistoricalRate } from "../interfaces";

const config = {
  method: "post",
  maxBodyLength: Infinity,
  headers: {
    "Content-Type": "application/json",
  },
};

const fetchAssets = async (): Promise<{
  currencies: Asset[];
  cryptos: Asset[];
}> => {
  const data = {
    jsonrpc: "2.0",
    id: 1,
    method: "v1/getAssets",
    params: [],
  };

  try {
    const response = await axios.post(QUICKNODE_ENDPOINT, data, config);
    const assets: Asset[] = response.data.result; // Adjust according to the actual response structure

    const currencies = assets
      .filter((asset) => asset.type_is_crypto === 0)
      .sort(
        (a, b) =>
          new Date(a.data_trade_start).getTime() -
          new Date(b.data_trade_start).getTime()
      );

    const cryptos = assets
      .filter(
        (asset) => asset.type_is_crypto === 1 && asset.volume_1mth_usd > 0 && asset.volume_1day_usd > 0
      )
      .sort((a, b) => b.volume_1mth_usd - a.volume_1mth_usd);

    return { currencies, cryptos };
  } catch (err) {
    console.error("Error fetching assets:", err);
    return { currencies: [], cryptos: [] };
  }
};

const fetchCurrentExchangeRates = async (
  assetBase: string,
  assetQuote: string
): Promise<ExchangeRate> => {
  const data = JSON.stringify({
    method: "v1/getCurrentExchangeRates",
    params: [
      {
        asset_id_base: assetBase,
      },
      {
        asset_id_quote: assetQuote,
      },
    ],
    id: 1,
    jsonrpc: "2.0",
  });

  try {
    const response = await axios.post(QUICKNODE_ENDPOINT, data, config);
    return response.data.result;
  } catch (err) {
    console.error("Error fetching current exchange rates:", err);
    return {
      time: "",
      asset_id_base: "",
      asset_id_quote: "",
      rate: 0,
    };
  }
};

const fetchHistoricalExchangeRates = async (
  assetBase: string,
  assetQuote: string,
  period: string,
  timeStart: string,
  timeEnd: string,
  limit: number
): Promise<HistoricalRate[]> => {

  const data = JSON.stringify({
    method: "v1/getHistoricalExchangeRates",
    params: [
      {
        assetBase: assetBase,
      },
      {
        assetQuote: assetQuote,
      },
      {
        period_id: period,
      },
      {
        time_start: timeStart,
      },
      {
        time_end: timeEnd,
      },
      {
        limit: limit,
      },
    ],
    id: 1,
    jsonrpc: "2.0",
  });

  try {
    const response = await axios.post(QUICKNODE_ENDPOINT, data, config);
    return response.data.result; // Adjust according to the actual response structure
  } catch (err) {
    console.error("Error fetching historical exchange rates:", err);
    return [];
  }
};

export { fetchAssets, fetchCurrentExchangeRates, fetchHistoricalExchangeRates };
