import Moralis from 'moralis';

export default async function handler(req, res) {
    const { address, chainId, type } = req.body;
    
    try {
        if (!Moralis.Core.isStarted) {
            await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
        }

        let resultData = {};

        if (type === 'evm') {
            // Fetch EVM Data
            const [balance, history] = await Promise.all([
                Moralis.EvmApi.wallets.getWalletActiveChains({ address, chains: [chainId] }),
                Moralis.EvmApi.wallets.getWalletHistory({ address, chain: chainId, limit: 15 })
            ]);
            resultData = {
                balance: balance.raw.active_chains[0]?.balance || "0",
                history: history.raw.result
            };
        } else if (type === 'solana') {
            // Fetch Solana Data
            const [balance, history] = await Promise.all([
                Moralis.SolanaApi.account.balance({ address, network: chainId }),
                Moralis.SolanaApi.account.getPortfolio({ address, network: chainId })
            ]);
            resultData = {
                balance: balance.raw.solana,
                history: history.raw.tokens // Solana history varies by endpoint
            };
        }

        return res.status(200).json(resultData);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
