/**
 * CCTP (Cross-Chain Transfer Protocol) helpers for Roil frontend.
 *
 * Uses viem for EVM interactions. Supports Ethereum, Base, Arbitrum,
 * Optimism, Polygon, Avalanche → Canton (native USDC burn-and-mint).
 */

import { createWalletClient, createPublicClient, custom, http, parseUnits, type Chain } from 'viem';
import { mainnet, base, arbitrum, optimism, polygon, avalanche } from 'viem/chains';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CCTPChain =
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'avalanche';

export interface ChainConfig {
  id: number;
  name: string;
  chain: Chain;
  tokenMessenger: `0x${string}`;
  messageTransmitter: `0x${string}`;
  usdc: `0x${string}`;
  domainId: number;
}

// ---------------------------------------------------------------------------
// Chain configurations
// ---------------------------------------------------------------------------

export const CCTP_CHAINS: Record<CCTPChain, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    chain: mainnet,
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    messageTransmitter: '0x0a992d191DEeC32aFe36203Ad87D7d289a738F81',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    domainId: 0,
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    chain: avalanche,
    tokenMessenger: '0x6b25532e1060CE10cc3B0A99e5683b91BFDe6982',
    messageTransmitter: '0x8186359aF5F57FbB40c6b14A588d2A59C0C29880',
    usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    domainId: 1,
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    chain: optimism,
    tokenMessenger: '0x2B4069517957735bE00ceE0fadAE88a26365528f',
    messageTransmitter: '0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8',
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    domainId: 2,
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    chain: arbitrum,
    tokenMessenger: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
    messageTransmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    domainId: 3,
  },
  base: {
    id: 8453,
    name: 'Base',
    chain: base,
    tokenMessenger: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
    messageTransmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    domainId: 6,
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    chain: polygon,
    tokenMessenger: '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE',
    messageTransmitter: '0xF3be9355363857F3e001be68856A2f96b4C39Ba9',
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    domainId: 7,
  },
};

export const CANTON_DOMAIN = 10;

// ---------------------------------------------------------------------------
// Contract ABIs (minimal)
// ---------------------------------------------------------------------------

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const TOKEN_MESSENGER_ABI = [
  {
    name: 'depositForBurn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
    ],
    outputs: [{ name: 'nonce', type: 'uint64' }],
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if MetaMask or another injected wallet is available.
 */
export function hasInjectedWallet(): boolean {
  return typeof window !== 'undefined' && !!(window as any).ethereum;
}

/**
 * Get current EVM address from injected wallet.
 */
export async function getEvmAddress(): Promise<`0x${string}` | null> {
  if (!hasInjectedWallet()) return null;
  const eth = (window as any).ethereum;
  const accounts = await eth.request({ method: 'eth_requestAccounts' });
  return (accounts?.[0] as `0x${string}`) ?? null;
}

/**
 * Ensure connected wallet is on the target chain; request switch if not.
 */
export async function switchToChain(chain: CCTPChain): Promise<void> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No injected wallet found');

  const chainId = `0x${CCTP_CHAINS[chain].id.toString(16)}`;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      throw new Error(`Chain ${chain} not added to wallet`);
    }
    throw err;
  }
}

/**
 * Read USDC allowance for CCTP TokenMessenger.
 */
export async function getUsdcAllowance(
  chain: CCTPChain,
  owner: `0x${string}`,
): Promise<bigint> {
  const cfg = CCTP_CHAINS[chain];
  const client = createPublicClient({ chain: cfg.chain, transport: http() });
  const result = await client.readContract({
    address: cfg.usdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, cfg.tokenMessenger],
  });
  return result as bigint;
}

/**
 * Read USDC balance.
 */
export async function getUsdcBalance(
  chain: CCTPChain,
  owner: `0x${string}`,
): Promise<bigint> {
  const cfg = CCTP_CHAINS[chain];
  const client = createPublicClient({ chain: cfg.chain, transport: http() });
  const result = await client.readContract({
    address: cfg.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [owner],
  });
  return result as bigint;
}

/**
 * Approve USDC for TokenMessenger. Returns tx hash.
 */
export async function approveUsdc(
  chain: CCTPChain,
  amount: bigint,
): Promise<`0x${string}`> {
  const cfg = CCTP_CHAINS[chain];
  await switchToChain(chain);
  const wallet = createWalletClient({
    chain: cfg.chain,
    transport: custom((window as any).ethereum),
  });
  const [account] = await wallet.getAddresses();
  const hash = await wallet.writeContract({
    account,
    address: cfg.usdc,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [cfg.tokenMessenger, amount],
  });
  return hash;
}

/**
 * Call depositForBurn on CCTP TokenMessenger.
 * Returns burn tx hash.
 */
export async function depositForBurn(args: {
  chain: CCTPChain;
  amount: bigint;
  mintRecipient: `0x${string}`; // bytes32 — Canton party hash from backend
}): Promise<`0x${string}`> {
  const cfg = CCTP_CHAINS[args.chain];
  await switchToChain(args.chain);
  const wallet = createWalletClient({
    chain: cfg.chain,
    transport: custom((window as any).ethereum),
  });
  const [account] = await wallet.getAddresses();
  const hash = await wallet.writeContract({
    account,
    address: cfg.tokenMessenger,
    abi: TOKEN_MESSENGER_ABI,
    functionName: 'depositForBurn',
    args: [args.amount, CANTON_DOMAIN, args.mintRecipient, cfg.usdc],
  });
  return hash;
}

/**
 * Convert USDC amount (human readable) to wei (6 decimals).
 */
export function parseUsdc(amount: string | number): bigint {
  return parseUnits(String(amount), 6);
}

/**
 * Format USDC wei to human readable.
 */
export function formatUsdc(wei: bigint): string {
  const whole = wei / 1_000_000n;
  const frac = wei % 1_000_000n;
  return frac === 0n ? whole.toString() : `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}
