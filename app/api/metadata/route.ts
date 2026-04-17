import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "NFT";
  const image = searchParams.get("image") ?? "";
  const tokenId = searchParams.get("tokenId") ?? "0";

  const metadata = {
    name: `${name} #${tokenId}`,
    description: "NFT minted on Arc Testnet",
    image: image,
    attributes: [
      { trait_type: "Network", value: "Arc Testnet" },
      { trait_type: "Token ID", value: tokenId },
    ],
  };

  return NextResponse.json(metadata);
}