import axios from 'axios';

export const refreshQuickBooksToken = async (refresh_token: string) => {
  const client_id = process.env.QB_CLIENT_ID!;
  const client_secret = process.env.QB_CLIENT_SECRET!;

  const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  const { data } = await axios.post(
    'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
    }),
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refresh_token,
  };
};
