# frozen_string_literal: true

module Api
  class PremiumController < ApplicationController
    # Example 4: Using before_action for multiple endpoints
    before_action :require_payment, only: [:show, :index]

    def index
      payment_info = request.env["x402.payment"]

      render json: {
        message: "Premium content list",
        items: ["Item 1", "Item 2", "Item 3"],
        paid_by: payment_info&.[](:payer)
      }
    end

    def show
      payment_info = request.env["x402.payment"]

      render json: {
        message: "Premium content details",
        id: params[:id],
        content: "This is premium content that requires payment",
        paid_by: payment_info&.[](:payer)
      }
    end

    def free
      render json: {
        message: "This premium controller endpoint is free",
        sample: "Here's a sample"
      }
    end

    private

    def require_payment
      x402_paywall(amount: 0.005, chain: "base-sepolia")
    end
  end
end
