export default async function handler(req, res) {
  try {
    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${endpoint}`;

    const response = await fetch(moralisUrl, {
      headers: {
        'X-API-Key': process.env.MORALIS_API_KEY
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Moralis request failed'
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}
