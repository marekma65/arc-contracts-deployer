"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDeployContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { useState } from "react";
import erc20Contract from "../lib/erc20-compiled.json";
import erc721Contract from "../lib/erc721-compiled.json";

interface DeployedContract {
  address: string;
  name: string;
  symbol: string;
  type: "ERC-20" | "ERC-721";
  extra: string;
  txHash: string;
  time: string;
}

export default function Home() {
  const { isConnected } = useAccount();
  const { deployContractAsync } = useDeployContract();

  const [tab, setTab] = useState<"ERC-20" | "ERC-721">("ERC-20");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [nftUri, setNftUri] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([]);
  const [pendingTx, setPendingTx] = useState<{ hash: `0x${string}`; name: string; symbol: string; type: "ERC-20" | "ERC-721"; extra: string } | null>(null);

  const { data: receipt, isSuccess } = useWaitForTransactionReceipt({
    hash: pendingTx?.hash,
  });

  if (isSuccess && receipt && pendingTx && receipt.contractAddress) {
    const alreadyAdded = deployedContracts.find((t) => t.txHash === pendingTx.hash);
    if (!alreadyAdded) {
      setDeployedContracts((prev) => [{
        address: receipt.contractAddress!,
        name: pendingTx.name,
        symbol: pendingTx.symbol,
        type: pendingTx.type,
        extra: pendingTx.extra,
        txHash: pendingTx.hash,
        time: new Date().toLocaleTimeString(),
      }, ...prev]);
      setPendingTx(null);
    }
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleDeploy() {
    if (!name || !symbol) return;
    setIsDeploying(true);
    try {
      let hash: `0x${string}`;
      if (tab === "ERC-20") {
        if (!supply || Number(supply) <= 0) return;
        hash = await deployContractAsync({
          abi: erc20Contract.abi,
          bytecode: erc20Contract.bytecode as `0x${string}`,
          args: [name, symbol, parseUnits(supply, 0)],
        });
      } else {
        hash = await deployContractAsync({
          abi: erc721Contract.abi,
          bytecode: erc721Contract.bytecode as `0x${string}`,
          args: [name, symbol],
        });
      }
      setPendingTx({ hash, name, symbol, type: tab, extra: tab === "ERC-20" ? supply : nftUri });
      showToast("success", "Deployment transaction sent!");
      setName("");
      setSymbol("");
      setSupply("");
      setNftUri("");
    } catch (e: any) {
      showToast("error", e?.shortMessage ?? e?.message ?? "Deployment failed");
    } finally {
      setIsDeploying(false);
    }
  }

  const isValid = tab === "ERC-20"
    ? name && symbol && supply && Number(supply) > 0
    : name && symbol;

  const explorerUrl = "https://testnet.arcscan.app";

  return (
    <main style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 1000, background: toast.type === "success" ? "#166534" : "#991B1B", color: "#fff", borderRadius: "14px", padding: "16px 20px", fontSize: "14px", fontWeight: 600, maxWidth: "320px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <div style={{ marginBottom: "4px" }}>{toast.type === "success" ? "Success" : "Error"}</div>
          <div style={{ fontWeight: 400, fontSize: "13px", opacity: 0.9 }}>{toast.message}</div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ background: "#1E293B", borderRadius: "24px", border: "1px solid #334155", padding: "2rem" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 2px" }}>Contract Deployer</h1>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>Deploy tokens and NFTs on Arc Testnet</p>
            </div>
            <ConnectButton showBalance={false} />
          </div>

          {/* Tab Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {(["ERC-20", "ERC-721"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ border: tab === t ? "2px solid #3B82F6" : "1px solid #334155", borderRadius: "12px", padding: "12px", background: tab === t ? "#1D3461" : "#0F172A", cursor: "pointer", color: tab === t ? "#60A5FA" : "#64748B", fontWeight: 700, fontSize: "14px" }}
              >
                {t === "ERC-20" ? "Token (ERC-20)" : "NFT (ERC-721)"}
              </button>
            ))}
          </div>

          {isConnected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              <div>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>{tab === "ERC-20" ? "Token name" : "Collection name"}</p>
                <input type="text" placeholder={tab === "ERC-20" ? "My Awesome Token" : "My NFT Collection"} value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
              </div>

              <div>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Symbol</p>
                <input type="text" placeholder={tab === "ERC-20" ? "MAT" : "MNFT"} value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} maxLength={8} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
              </div>

              {tab === "ERC-20" && (
                <div>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Initial supply</p>
                  <input type="number" placeholder="1000000" value={supply} onChange={(e) => setSupply(e.target.value)} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
                  <p style={{ fontSize: "11px", color: "#475569", margin: "4px 0 0" }}>Tokens will be sent to your wallet.</p>
                </div>
              )}

              {tab === "ERC-721" && (
                <div>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Base metadata URI <span style={{ color: "#475569", fontSize: "11px" }}>(optional)</span></p>
                  <input type="text" placeholder="ipfs://..." value={nftUri} onChange={(e) => setNftUri(e.target.value)} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "14px", background: "#0F172A", color: "#F8FAFC", outline: "none", fontFamily: "monospace" }} />
                  <p style={{ fontSize: "11px", color: "#475569", margin: "4px 0 0" }}>After deployment you can mint NFTs by calling the mint() function.</p>
                </div>
              )}

              <button
                onClick={handleDeploy}
                disabled={!isValid || isDeploying}
                style={{ width: "100%", background: !isValid || isDeploying ? "#1E293B" : "linear-gradient(135deg, #3B82F6, #6366F1)", color: !isValid || isDeploying ? "#475569" : "#fff", border: "1px solid #334155", borderRadius: "14px", padding: "15px", fontSize: "15px", fontWeight: 700, cursor: !isValid || isDeploying ? "not-allowed" : "pointer" }}
              >
                {isDeploying ? "Deploying..." : "Deploy " + tab}
              </button>

              {pendingTx && !isSuccess && (
                <div style={{ background: "#1D3461", border: "1px solid #3B82F6", borderRadius: "12px", padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#60A5FA" }}>Waiting for confirmation...</p>
                  <a href={explorerUrl + "/tx/" + pendingTx.hash} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#60A5FA", fontFamily: "monospace", display: "block", marginTop: "4px" }}>
                    {pendingTx.hash.slice(0, 30) + "..."}
                  </a>
                </div>
              )}

              <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", margin: 0 }}>Powered by your wallet • Arc Testnet</p>
            </div>
          )}
        </div>

        {deployedContracts.length > 0 && (
          <div style={{ background: "#1E293B", borderRadius: "24px", border: "1px solid #334155", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#94A3B8", margin: 0 }}>Deployed Contracts</h2>
              <button onClick={() => setDeployedContracts([])} style={{ fontSize: "12px", color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {deployedContracts.map((contract, i) => (
                <div key={i} style={{ background: "#0F172A", borderRadius: "12px", padding: "14px", border: "1px solid #334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC" }}>{contract.name} ({contract.symbol})</span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>{contract.time}</span>
                  </div>
                  <span style={{ fontSize: "11px", background: contract.type === "ERC-20" ? "#1D3461" : "#2D1B69", color: contract.type === "ERC-20" ? "#60A5FA" : "#A78BFA", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>{contract.type}</span>
                  {contract.type === "ERC-20" && (
                    <p style={{ fontSize: "12px", color: "#60A5FA", margin: "6px 0 4px" }}>Supply: {Number(contract.extra).toLocaleString()} {contract.symbol}</p>
                  )}
                  <a href={explorerUrl + "/address/" + contract.address} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: "11px", color: "#60A5FA", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "underline", marginTop: "6px" }}>
                    {contract.address}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}