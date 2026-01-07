import Moralis from 'moralis';

export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address, chainId } = req.body;

  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    // Fetch unified data from Moralis
    const [walletStats, walletHistory] = await Promise.all([
      Moralis.EvmApi.wallets.getWalletActiveChains({ address }),
      Moralis.EvmApi.wallets.getWalletHistory({ address, chain: chainId, order: "DESC", limit: 20 })
    ]);

    // Calculate age based on the earliest transaction in history or metadata
    const firstTx = await Moralis.EvmApi.wallets.getWalletHistory({ address, chain: chainId, order: "ASC", limit: 1 });

    return res.status(200).json({
      balance: walletStats.raw.active_chains.find(c => c.chain_id === chainId)?.balance || "0",
      history: walletHistory.raw.result,
      firstTxDate: firstTx.raw.result[0]?.block_timestamp || new Date().toISOString()
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
