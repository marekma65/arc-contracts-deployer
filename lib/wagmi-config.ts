import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./arc-config";

export const config = getDefaultConfig({
  appName: "Arc Contracts Deployer",
  projectId: "5da801378826acf33a1ae02038d78f58",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
});