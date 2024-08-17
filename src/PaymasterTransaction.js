import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Provider, Wallet, types } from 'zksync-ethers';
import { getPaymasterParams } from 'zksync-ethers/build/paymaster-utils';

const PaymasterTransaction = () => {
  const [message, setMessage] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [blockNumber, setBlockNumber] = useState('');
  const [provider, setProvider] = useState(null);
  const [wallet, setWallet] = useState(null);

  const PAYMASTER = '0xE5Cebaf0AB44D0Fc129848CFE0393b0C80Ec74f8'; // Replace with your paymaster address
  const simpleStoreAddress = '0xF30eB8A430d22d69CF6C749a4CEb1Af971CAa2a2';

  const SIMPLE_STORE_ABI = [
    {
      inputs: [],
      name: 'getMessage',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'newMessage',
          type: 'string',
        },
      ],
      name: 'setMessage',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  // Hardcoded private key for testing
  const PRIVATE_KEY = ''; // Replace with your private key

  useEffect(() => {
    const initializeProviderAndWallet = () => {
      const newProvider = Provider.getDefaultProvider(types.Network.Sepolia);
      const newWallet = new Wallet(PRIVATE_KEY, newProvider);
      setProvider(newProvider);
      setWallet(newWallet);
    };

    initializeProviderAndWallet();
  }, []);

  const sendTransaction = async () => {
    if (!wallet) {
      alert('Wallet is not initialized');
      return;
    }

    try {
      const simpleStoreContract = new ethers.Contract(simpleStoreAddress, SIMPLE_STORE_ABI, wallet);

      // Create transaction data to call setMessage with the new message
      const txData = await simpleStoreContract.populateTransaction.setMessage(message);

      // Add custom data for paymaster sponsorship
      txData.customData = {
        paymasterParams: getPaymasterParams(PAYMASTER, {
          type: 'General',
          innerInput: new Uint8Array(), // Adjust this if your paymaster needs specific parameters
        }),
      };

      // Send the transaction with paymaster integration
      const tx = await wallet.sendTransaction(txData);

      setTransactionHash(tx.hash);

      // Wait for the transaction to be confirmed
      const receipt = await tx.wait();
      setBlockNumber(receipt.blockNumber);

      // Fetch the updated message
      const updatedMessage = await simpleStoreContract.getMessage();
      setCurrentMessage(updatedMessage);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  return (
    <div>
      <h1>zkSync Paymaster Transaction</h1>
      <div>
        <input
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendTransaction}>Send Transaction</button>
      </div>
      {transactionHash && (
        <div>
          <p>Transaction Hash: {transactionHash}</p>
          <p>Confirmed in Block: {blockNumber}</p>
          <p>Current Message: {currentMessage}</p>
        </div>
      )}
    </div>
  );
};

export default PaymasterTransaction;
