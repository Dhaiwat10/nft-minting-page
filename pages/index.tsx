import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from 'wagmi';
import { UseContractConfig } from 'wagmi/dist/declarations/src/hooks/contracts/useContract';
import config from '../contractConfig.json';
import { IpfsImage } from 'react-ipfs-image';
import { ethers } from 'ethers';
import Confetti from 'react-confetti';

const contractConfig: UseContractConfig = {
  addressOrName: config.address,
  contractInterface: config.abi,
};

const Home: NextPage = () => {
  const { data: tokenURI } = useContractRead({
    ...contractConfig,
    functionName: 'commonTokenURI',
  });
  const { data: mintCost } = useContractRead({
    ...contractConfig,
    functionName: 'mintCost',
  });
  const [imageHash, setImageHash] = useState('');

  useEffect(() => {
    (async () => {
      if (tokenURI) {
        const gatewayUrl = tokenURI?.replace(
          'ipfs://',
          'https://gateway.pinata.cloud/ipfs/'
        );
        const json = await fetch(gatewayUrl).then((res) => res.json());
        setImageHash(json.image);
      }
    })();
  }, [tokenURI]);

  // fetch the current active wallet connection's address
  const { address } = useAccount();

  const { config } = usePrepareContractWrite({
    ...contractConfig,
    functionName: 'mint',
    args: [address, { value: mintCost?.toString() }],
  });

  const { writeAsync } = useContractWrite(config);
  const [mintLoading, setMintLoading] = useState(false);
  const [mintSuccess, setMintSucces] = useState(false);

  const onMintClick = async () => {
    setMintSucces(false);
    setMintLoading(true);
    try {
      const tx = await writeAsync?.();
      const res = await tx?.wait();
      setMintSucces(true);
    } catch (error) {
      console.error(error);
    } finally {
      setMintLoading(false);
    }
  };

  return (
    <div className='flex flex-col p-20'>
      {mintSuccess && <Confetti />}
      <div className='flex'>
        <ConnectButton />
      </div>

      <IpfsImage hash={imageHash} className='mt-4 w-[300px]' />

      {mintCost && (
        <p className='mt-4'>
          You will have to pay {ethers.utils.formatEther(mintCost?.toString())}{' '}
          ETH
        </p>
      )}

      <button
        disabled={mintLoading}
        onClick={onMintClick}
        className='mt-2 rounded bg-blue-900 px-4 py-2 font-bold text-white w-fit disabled:opacity-50'
      >
        {mintLoading ? 'Minting...please check wallet and wait' : 'Mint'}
      </button>
    </div>
  );
};

export default Home;
