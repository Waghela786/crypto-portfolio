import React, { useEffect, useState } from 'react';
import { getCoinsList } from '../services/api';

const Wallet = () => {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await getCoinsList();
        const coins = response.data;
        // Cache the response
        localStorage.setItem('cachedCoins', JSON.stringify(coins));
        return coins;
      } catch (error) {
        console.error('Error fetching coins:', error);
        // Use cached data if available
        const cached = localStorage.getItem('cachedCoins');
        return cached ? JSON.parse(cached) : [];
      }
    };

    fetchCoins();
  }, []);

  return (
    <div>
      <h1>My Wallet</h1>
      <ul>
        {coins.map(coin => (
          <li key={coin.id}>{coin.name} ({coin.symbol})</li>
        ))}
      </ul>
    </div>
  );
};

export default Wallet;