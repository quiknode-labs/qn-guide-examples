Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # x402 Payment Protocol Test Endpoints
  namespace :api do
    # Weather API endpoints (direct x402_paywall usage)
    get "weather/paywalled_info", to: "weather#paywalled_info"
    get "weather/paywalled_info_sol", to: "weather#paywalled_info_sol"
    get "weather/public", to: "weather#public_info"

    # Premium API endpoints (before_action usage)
    resources :premium, only: [ :index, :show ] do
      collection do
        get :free
      end
    end
  end

  # Root route shows available endpoints
  root to: proc { [ 200, { "Content-Type" => "application/json" }, [
    {
      message: "x402-rails Test API",
      endpoints: {
        free: [
          { path: "/api/weather/public", description: "Free weather info" },
          { path: "/api/premium/free", description: "Free premium endpoint" }
        ],
        paid: [
          { path: "/api/weather/paywalled_info", price: "$0.001", description: "Current weather" },
          { path: "/api/weather/forecast", price: "$0.01", description: "Weather forecast" },
          { path: "/api/premium", price: "$0.005", description: "Premium content list" },
          { path: "/api/premium/:id", price: "$0.005", description: "Premium content details" }
        ]
      },
      documentation: "https://github.com/quiknode-labs/x402-rails"
    }.to_json
  ] ] }
end
