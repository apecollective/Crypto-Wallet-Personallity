// /api/analyze.js
import Moralis from 'moralis';

export default async function handler(req, res) {
    // 1. Set CORS headers so your frontend can talk to this server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { address, chainId, type } = req.body;

    try {
        // Initialize Moralis with your Secret Key (Hidden from the public)
        if (!Moralis.Core.isStarted) {
            await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
        }

        let responseData = { balance: "0", history: [] };

        if (type === 'evm') {
            // Fetch EVM Data (Ethereum, BSC, Polygon, etc.)
            const [walletStats, history] = await Promise.all([
                Moralis.EvmApi.wallets.getWalletActiveChains({ address, chains: [chainId] }),
                Moralis.EvmApi.wallets.getWalletHistory({ address, chain: chainId, limit: 15 })
            ]);
            
            responseData.balance = walletStats.raw.active_chains[0]?.balance || "0";
            responseData.history = history.raw.result;

        } else if (type === 'solana') {
            // Fetch Solana Data
            const [balance, portfolio] = await Promise.all([
                Moralis.SolanaApi.account.balance({ address, network: chainId }),
                Moralis.SolanaApi.account.getPortfolio({ address, network: chainId })
            ]);
            
            responseData.balance = balance.raw.solana; // Native SOL balance
            responseData.history = portfolio.raw.tokens; // Using token activity for history

        } else if (type === 'utxo') {
            // Moralis doesn't support Bitcoin/Doge via SDK yet, using public backup
            const btcRes = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);
            const btcData = await btcRes.json();
            responseData.balance = (btcData.balance / 100000000).toString(); // Convert Satoshis to BTC
            responseData.history = new Array(5).fill({ value_decimal: 0.1 }); // Placeholder for UI
        }

        return res.status(200).json(responseData);

    } catch (error) {
        console.error("Moralis Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
