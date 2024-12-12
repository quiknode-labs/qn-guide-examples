import { Zap, Github } from "lucide-react";

const QuickNodeBanner = () => {
  return (
    <div className="flex items-center justify-between px-4 py-2 mt-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/20">
      <div className="flex items-center gap-2">
        <Zap size={20} className="text-blue-500 flex-shrink-0" />
        <span className="text-sm">
          Powered by QuickNode{" "}
          <a
            href="https://quicknode.com/streams?utm_source=internal&utm_campaign=guides&utm_content=aave-v3-liquidation-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            Streams
          </a>
          {" and "}
          <a
            href="https://quicknode.com/functions?utm_source=internal&utm_campaign=guides&utm_content=aave-v3-liquidation-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-purple-500 hover:text-purple-600 transition-colors"
          >
            Functions
          </a>{" "}
          — Serverless historical and real-time blockchain data.
        </span>
      </div>

      <a
        href="https://github.com/quiknode-labs/qn-guide-examples/tree/main/sample-dapps/ethereum-aave-liquidation-tracker"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-4"
      >
        <Github size={18} />
        <span>View on GitHub</span>
      </a>
    </div>
  );
};

export default QuickNodeBanner;
