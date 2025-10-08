const axios = require('axios');

(async () => {
  try {
    const base = 'http://localhost:5000/api';
    const ts = Date.now();
  const emailA = `userA_${ts}@example.com`;
  const emailB = `userB_${ts}@example.com`;
    console.log('Emails:', emailA, emailB);

    const regA = await axios.post(`${base}/users/register`, {
      name: 'User A',
      email: emailA,
      password: 'Password1!',
    });
    const tokenA = regA.data.token;
    console.log('A token:', tokenA);

    const regB = await axios.post(`${base}/users/register`, {
      name: 'User B',
      email: emailB,
      password: 'Password1!',
    });
    const tokenB = regB.data.token;
    console.log('B token:', tokenB);

    console.log('Creating wallet for A (10 BTC)...');
    const walletA = await axios.post(
      `${base}/wallets`,
      { coin: 'BTC', amount: 10 },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log('Wallet A:', walletA.data);

    console.log('Sending 1 BTC A -> B...');
    const send = await axios.post(
      `${base}/transactions/send`,
      { coin: 'BTC', amount: 1, toEmail: emailB },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log('Send response:', send.data);

    // small delay to let notification be created
    await new Promise((r) => setTimeout(r, 1000));

    console.log("Fetching notifications for B...");
    const notifs = await axios.get(`${base}/notifications`, { headers: { Authorization: `Bearer ${tokenB}` } });
    console.log('Notifications for B:', notifs.data);
  } catch (err) {
    if (err.response) {
      console.error('Request failed:', err.response.status, err.response.data);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
})();
