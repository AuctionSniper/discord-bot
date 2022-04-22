import fetch from 'node-fetch';
import throttledQueue from 'throttled-queue';

import { redis } from '../config/redisConfig';

const throttle = throttledQueue(120, 60 * 1000);

type RawAuction = {
  uuid: string;
  item_name: string;
  tier: string;
  claimed: boolean;
  item_bytes: {
    data: string;
  };
  starting_bid: number;
  bin: boolean;
  highest_bid_amount: number;
  end: number;
};

type Auction = {
  uuid: string;
  name: string;
  tier: string;
  item_bytes: string;
  price: number;
  end: number;
};

function transformAuctions(rawAuctions: RawAuction[]): Auction[] {
  const auctions: Auction[] = [];

  Object.values(rawAuctions).forEach(auction => {
    if (auction.claimed) return;

    auctions.push({
      uuid: auction.uuid,
      name: auction.item_name,
      tier: auction.tier,
      item_bytes: auction.item_bytes.data,
      price: auction.bin ? auction.starting_bid : auction.highest_bid_amount,
      end: auction.end,
    });
  });

  return auctions;
}

export async function fetchAuctions(
  id: string,
  key: string,
): Promise<Auction[]> {
  const redisAuctions = await redis.get(`auctions-${id}`);

  if (redisAuctions) {
    return JSON.parse(redisAuctions);
  }

  const response = await throttle(() =>
    fetch(`https://api.hypixel.net/skyblock/auction?key=${key}&player=${id}`),
  );

  const json = await response.json();
  const auctions = transformAuctions(json.auctions as RawAuction[]);

  await redis.set(`auctions-${id}`, JSON.stringify(auctions), 'EX', 60);

  return auctions;
}
