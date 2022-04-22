import fetch from 'node-fetch';

type PlayerDBResponse = {
  data: {
    player: {
      username: string;
      raw_id: string;
    };
  };
};

type PlayerData = {
  username: string;
  id: string;
};

export async function fetchId(username: string): Promise<PlayerData> {
  const response = await fetch(
    `https://playerdb.co/api/player/minecraft/${username}`,
  );

  const json = (await response.json()) as PlayerDBResponse;

  return {
    username: json.data.player.username,
    id: json.data.player.raw_id,
  };
}
