class ApplicationController < ActionController::API
  # Application-wide x402 error handling
  rescue_from X402::InvalidPaymentError, with: :render_payment_error
  rescue_from X402::FacilitatorError, with: :render_facilitator_error
  rescue_from X402::ConfigurationError, with: :render_config_error

  private

  def render_payment_error(exception)
    render json: {
      error: "Payment Error",
      message: exception.message,
      type: "invalid_payment",
      status: 402
    }, status: :payment_required
  end

  def render_facilitator_error(exception)
    Rails.logger.error("[x402] Facilitator error: #{exception.message}")

    render json: {
      error: "Payment Service Unavailable",
      message: "Unable to process payment. Please try again.",
      type: "facilitator_error",
      status: 503
    }, status: :service_unavailable
  end

  def render_config_error(exception)
    Rails.logger.fatal("[x402] Configuration error: #{exception.message}")

    render json: {
      error: "Service Configuration Error",
      message: "Payment system not properly configured",
      status: 500
    }, status: :internal_server_error
  end
end
