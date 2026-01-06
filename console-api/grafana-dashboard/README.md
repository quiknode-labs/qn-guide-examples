# Quicknode Grafana Dashboard Example

This folder contains all the necessary configuration files to set up a Grafana dashboard for monitoring your Quicknode RPC infrastructure using Prometheus. This example is part of the [How to Build a Grafana Dashboard to Monitor Your RPC Infrastructure](https://www.quicknode.com/guides/quicknode-products/console-api/how-to-build-a-grafana-dashboard-to-monitor-your-rpc-infrastructure) guide, which walks you through setting up a real-time monitoring system.

## Prerequisites

- **Docker Desktop**: Ensure you have **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** installed and running. This setup uses Docker to launch Prometheus and Grafana easily.

- **Quicknode Account and API Key**: Make sure you have an [API key](https://dashboard.quicknode.com/api-keys) with appropriate permissions (`CONSOLE_REST`).

## Getting Started

1. Clone this repository:

```sh
git clone https://github.com/quiknode-labs/qn-guide-examples.git
```

2. Navigate to the `grafana-dashboard` folder:

```sh
cd qn-guide-examples/console-api/grafana-dashboard
```

3. Update the `prometheus.yaml` file in the `prometheus` folder with your Quicknode API key.

4. Launch Prometheus and Grafana using Docker Compose:

```sh
docker-compose up
```

5. Access Grafana by navigating to http://localhost:3000 in your web browser.

For more detailed instructions, please refer to the guide: [How to Build a Grafana Dashboard to Monitor Your RPC Infrastructure](https://www.quicknode.com/guides/quicknode-products/console-api/how-to-build-a-grafana-dashboard-to-monitor-your-rpc-infrastructure).