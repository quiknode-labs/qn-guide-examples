# frozen_string_literal: true

module Api
  class WeatherController < ApplicationController
    def paywalled_info
      x402_paywall(amount: 0.001)
      return if performed?  # Stop if paywall already rendered 402

      payment_info = request.env["x402.payment"]

      render json: {
        temperature: 72,
        condition: "sunny",
        humidity: 65,
        paid_by: payment_info&.[](:payer),
        payment_amount: payment_info&.[](:amount),
        network: payment_info&.[](:network),
        payment_info: payment_info
      }
    end

    def paywalled_info_sol
      x402_paywall(
        amount: 0.001,
        chain: "solana-devnet",
        currency: "USDC",
        solana_fee_payer: ENV.fetch(
          "X402_SOLANA_FEE_PAYER",
          "FuzoZt4zXaYLvXRguKw2T6xvKvzZqv6PkmaFjNrEG7jm"
        ),
        wallet_address: ENV.fetch(
          "X402_SOL_PAY_TO",
          "EYNQARNg9gZTtj1xMMrHK7dRFAkVjAAMubxaH7Do8d9Y"
        )
      )
      return if performed?  # Stop if paywall already rendered 402

      payment_info = request.env["x402.payment"]

      render json: {
        temperature: 78,
        condition: "cloudy",
        humidity: 80,
        paid_by: payment_info&.[](:payer),
        payment_amount: payment_info&.[](:amount),
        network: payment_info&.[](:network),
        payment_info: payment_info
      }
    end

    # Example 3: Free endpoint (no paywall)
    def public_info
      render json: {
        message: "This endpoint is free!",
        location: "San Francisco",
        timezone: "PST"
      }
    end
  end
end
