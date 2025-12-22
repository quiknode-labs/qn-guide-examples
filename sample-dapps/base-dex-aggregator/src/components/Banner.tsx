export default function Banner() {
  return (
    <div className="w-full bg-blue-600 text-white py-2 text-center text-sm">
      Built with the{" "}
      <a
        href="https://marketplace.quicknode.com/bundles/basebundle"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-blue-100 transition-colors"
      >
        Quicknode Base DeFi Bundle
      </a>{" "}
      - Check out the codebase {}
      <a
        href="https://www.quicknode.com/sample-app-library/welcome"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-blue-100 transition-colors"
      >
        here
      </a>
    </div>
  );
}

