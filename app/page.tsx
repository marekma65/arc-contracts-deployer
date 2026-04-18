"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDeployContract, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useState } from "react";
import erc20Contract from "../lib/erc20-compiled.json";
import erc721Contract from "../lib/erc721-compiled.json";

const ERC721_MINT_ABI = [
  {
    name: "mint",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

interface DeployedItem {
  address: string;
  name: string;
  symbol: string;
  type: "Token" | "NFT";
  supply?: string;
  imageUrl?: string;
  tokenId?: number;
  time: string;
}

const BASE_URL = typeof window !== "undefined"
  ? window.location.origin
  : "https://arc-contracts-deployer-sand.vercel.app";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { deployContractAsync } = useDeployContract();
  const { writeContractAsync } = useWriteContract();

  const [tab, setTab] = useState<"Token" | "NFT">("Token");

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");

  const [nftName, setNftName] = useState("");
  const [nftSymbol, setNftSymbol] = useState("");
  const [nftImageUrl, setNftImageUrl] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deployedItems, setDeployedItems] = useState<DeployedItem[]>([]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  async function waitForReceipt(hash: string): Promise<string> {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch("https://rpc.testnet.arc.network", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionReceipt", params: [hash], id: 1 }),
        });
        const data = await res.json();
        if (data.result?.contractAddress) return data.result.contractAddress;
      } catch {}
    }
    throw new Error("Timeout waiting for contract");
  }

  async function handleDeployToken() {
    if (!tokenName || !tokenSymbol || !tokenSupply || Number(tokenSupply) <= 0) return;
    setIsProcessing(true);
    setStatusMsg("Deploying token...");
    try {
      const hash = await deployContractAsync({
        abi: erc20Contract.abi,
        bytecode: erc20Contract.bytecode as `0x${string}`,
        args: [tokenName, tokenSymbol, parseUnits(tokenSupply, 0)],
      });

      setStatusMsg("Waiting for confirmation...");
      const contractAddress = await waitForReceipt(hash);

      setDeployedItems((prev) => [{
        address: contractAddress,
        name: tokenName,
        symbol: tokenSymbol,
        type: "Token",
        supply: tokenSupply,
        time: new Date().toLocaleTimeString(),
      }, ...prev]);

      showToast("success", "Token created!");
      setTokenName("");
      setTokenSymbol("");
      setTokenSupply("");
      setStatusMsg("");
    } catch (e: any) {
      showToast("error", e?.shortMessage ?? e?.message ?? "Failed");
      setStatusMsg("");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleMintNFT() {
    if (!nftName || !nftSymbol || !address) return;
    setIsProcessing(true);
    setStatusMsg("Step 1/2: Deploying NFT contract...");
    try {
      const deployHash = await deployContractAsync({
        abi: erc721Contract.abi,
        bytecode: erc721Contract.bytecode as `0x${string}`,
        args: [nftName, nftSymbol],
      });

      setStatusMsg("Step 1/2: Waiting for contract...");
      const contractAddress = await waitForReceipt(deployHash);

      setStatusMsg("Step 2/2: Minting your NFT...");

      const tokenId = 0;
      const metadataUrl = `${BASE_URL}/api/metadata?name=${encodeURIComponent(nftName)}&image=${encodeURIComponent(nftImageUrl)}&tokenId=${tokenId}`;

      await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: ERC721_MINT_ABI,
        functionName: "mint",
        args: [address, metadataUrl],
      });

      setDeployedItems((prev) => [{
        address: contractAddress,
        name: nftName,
        symbol: nftSymbol,
        type: "NFT",
        imageUrl: nftImageUrl,
        tokenId,
        time: new Date().toLocaleTimeString(),
      }, ...prev]);

      showToast("success", "NFT minted!");
      setNftName("");
      setNftSymbol("");
      setNftImageUrl("");
      setStatusMsg("");
    } catch (e: any) {
      showToast("error", e?.shortMessage ?? e?.message ?? "Failed");
      setStatusMsg("");
    } finally {
      setIsProcessing(false);
    }
  }

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
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 2px" }}>Arc Deployer</h1>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>Create tokens and NFTs on Arc Testnet</p>
            </div>
            <ConnectButton showBalance={false} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {(["Token", "NFT"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ border: tab === t ? "2px solid #3B82F6" : "1px solid #334155", borderRadius: "12px", padding: "12px", background: tab === t ? "#1D3461" : "#0F172A", cursor: "pointer", color: tab === t ? "#60A5FA" : "#64748B", fontWeight: 700, fontSize: "14px" }}>
                {t === "Token" ? "Token (ERC-20)" : "NFT (ERC-721)"}
              </button>
            ))}
          </div>

          {isConnected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {tab === "Token" && (
                <>
                  <div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Token name</p>
                    <input type="text" placeholder="My Awesome Token" value={tokenName} onChange={(e) => setTokenName(e.target.value)} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Symbol</p>
                    <input type="text" placeholder="MAT" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())} maxLength={8} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Initial supply</p>
                    <input type="number" placeholder="1000000" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
                    <p style={{ fontSize: "11px", color: "#475569", margin: "4px 0 0" }}>All tokens will be sent to your wallet.</p>
                  </div>
                  <button onClick={handleDeployToken} disabled={!tokenName || !tokenSymbol || !tokenSupply || isProcessing} style={{ width: "100%", background: !tokenName || !tokenSymbol || !tokenSupply || isProcessing ? "#1E293B" : "linear-gradient(135deg, #3B82F6, #6366F1)", color: !tokenName || !tokenSymbol || !tokenSupply || isProcessing ? "#475569" : "#fff", border: "1px solid #334155", borderRadius: "14px", padding: "15px", fontSize: "15px", fontWeight: 700, cursor: !tokenName || !tokenSymbol || !tokenSupply || isProcessing ? "not-allowed" : "pointer" }}>
                    {isProcessing ? statusMsg || "Processing..." : "Create Token"}
                  </button>
                </>
              )}

              {tab === "NFT" && (
                <>
                  <div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>NFT name</p>
                    <input type="text" placeholder="My First NFT" value={nftName} onChange={(e) => setNftName(e.target.value)} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Symbol</p>
                    <input type="text" placeholder="MNFT" value={nftSymbol} onChange={(e) => setNftSymbol(e.target.value.toUpperCase())} maxLength={8} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "15px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 8px" }}>Image URL <span style={{ color: "#475569", fontSize: "11px" }}>(optional)</span></p>
                    <input type="text" placeholder="https://..." value={nftImageUrl} onChange={(e) => setNftImageUrl(e.target.value)} style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155", fontSize: "14px", background: "#0F172A", color: "#F8FAFC", outline: "none" }} />
                    <p style={{ fontSize: "11px", color: "#475569", margin: "4px 0 0" }}>Paste a direct link to your image (must end with .jpg, .png, .gif, .webp etc.)</p>
                  </div>

                  {nftImageUrl && (
                    <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #334155", maxHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A" }}>
                      <img src={nftImageUrl} alt="NFT preview" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}

                  <button onClick={handleMintNFT} disabled={!nftName || !nftSymbol || isProcessing} style={{ width: "100%", background: !nftName || !nftSymbol || isProcessing ? "#1E293B" : "linear-gradient(135deg, #7C3AED, #A855F7)", color: !nftName || !nftSymbol || isProcessing ? "#475569" : "#fff", border: "1px solid #334155", borderRadius: "14px", padding: "15px", fontSize: "15px", fontWeight: 700, cursor: !nftName || !nftSymbol || isProcessing ? "not-allowed" : "pointer" }}>
                    {isProcessing ? statusMsg || "Processing..." : "Mint NFT"}
                  </button>
                </>
              )}

              {statusMsg && (
                <div style={{ background: "#1D3461", border: "1px solid #3B82F6", borderRadius: "12px", padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#60A5FA" }}>{statusMsg}</p>
                </div>
              )}

              <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", margin: 0 }}>Powered by your wallet • Arc Testnet</p>
            </div>
          )}
        </div>

        {deployedItems.length > 0 && (
          <div style={{ background: "#1E293B", borderRadius: "24px", border: "1px solid #334155", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#94A3B8", margin: 0 }}>Created</h2>
              <button onClick={() => setDeployedItems([])} style={{ fontSize: "12px", color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {deployedItems.map((item, i) => (
                <div key={i} style={{ background: "#0F172A", borderRadius: "12px", padding: "14px", border: "1px solid #334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC" }}>{item.name} ({item.symbol})</span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>{item.time}</span>
                  </div>
                  <span style={{ fontSize: "11px", background: item.type === "Token" ? "#1D3461" : "#2D1B69", color: item.type === "Token" ? "#60A5FA" : "#A78BFA", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>{item.type}</span>
                  {item.type === "Token" && item.supply && (
                    <p style={{ fontSize: "12px", color: "#60A5FA", margin: "6px 0 4px" }}>Supply: {Number(item.supply).toLocaleString()} {item.symbol}</p>
                  )}
                  {item.type === "NFT" && (
                    <p style={{ fontSize: "12px", color: "#A78BFA", margin: "6px 0 4px" }}>Token ID: {item.tokenId ?? 0}</p>
                  )}
                  {item.type === "NFT" && item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginTop: "4px", display: "block" }} />
                  )}
                  <a href={explorerUrl + "/address/" + item.address} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: "11px", color: "#60A5FA", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "underline", marginTop: "6px" }}>
                    {item.address}
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