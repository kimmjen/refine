import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.jing.rocks',
  'https://vid.puffyan.us',
  'https://invidious.nerdvpn.de',
  'https://inv.zzls.xyz'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { list } = req.query;

  if (!list || typeof list !== 'string') {
    return res.status(400).json({ error: 'List ID is required' });
  }

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/playlists/${list}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Refine/1.0; +https://refine.app)'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch {
      continue;
    }
  }

  return res.status(502).json({ error: 'Failed to fetch playlist from all instances' });
}
