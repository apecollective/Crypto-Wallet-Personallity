// /api/analyze.js
import Moralis from 'moralis';

export default async function handler(req, res) {
  // 1. Setup CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address, chain } = req.body;

  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    // 2. Fetch Wallet Stats & History
    const [balance, history] = await Promise.all([
      Moralis.EvmApi.wallets.getWalletActiveChains({ address }),
      Moralis.EvmApi.wallets.getWalletHistory({ address, chain, limit: 15 })
    ]);

    // 3. Return only the necessary data to the client
    return res.status(200).json({
      rawBalance: balance.raw,
      transactions: history.raw.result,
      chain: chain
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
