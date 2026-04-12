/**
 * xReserve client for Roil frontend — Circle's USDC bridge to Canton.
 *
 * Canton is NOT a CCTP domain. USDC arrives on Canton via Circle's xReserve
 * (lock-and-mint). This file handles the Ethereum-side interactions:
 * approve USDC → call depositToRemote on xReserve contract.
 *
 * Reference: github.com/digital-asset/xreserve-deposits/canton-deposit-script-v2
 */

import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  parseUnits,
  keccak256,
  toHex,
  stringToBytes,
  type Chain,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type XReserveSource = 'ethereum' | 'sepolia';

export interface XReserveChain {
  id: XReserveSource;
  chainId: number;
  name: string;
  chain: Chain;
  xReserveContract: `0x${string}`;
  usdcContract: `0x${string}`;
}

export const XRESERVE_CHAINS: Record<XReserveSource, XReserveChain> = {
  sepolia: {
    id: 'sepolia',
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    chain: sepolia,
    xReserveContract: '0x008888878f94C0d87defdf0B07f46B93C1934442',
    usdcContract: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  ethereum: {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    chain: mainnet,
    xReserveContract: '0x8888888199b2Df864bf678259607d6D5EBb4e3Ce',
    usdcContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
};

export const CANTON_DOMAIN = 10001;
export const ETHEREUM_DOMAIN = 0;

// ---------------------------------------------------------------------------
// ABIs — from digital-asset/xreserve-deposits
// ---------------------------------------------------------------------------

const X_RESERVE_ABI = [
  {
    name: 'depositToRemote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'value', type: 'uint256' },
      { name: 'remoteDomain', type: 'uint32' },
      { name: 'remoteRecipient', type: 'bytes32' },
      { name: 'localToken', type: 'address' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

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

// ---------------------------------------------------------------------------
// Recipient encoding — exactly matches xreserve-deposits reference
// ---------------------------------------------------------------------------

/**
 * Encode Canton party ID for xReserve depositToRemote.
 * Per reference: remoteRecipientBytes32 = keccak256(utf8_bytes(party_id))
 */
export function encodeRecipientBytes32(cantonParty: string): `0x${string}` {
  return keccak256(stringToBytes(cantonParty));
}

/**
 * Encode Canton party ID as hookData.
 * Per reference: hookData = 0x + hex(utf8_bytes(party_id))
 */
export function encodeHookData(cantonParty: string): `0x${string}` {
  return toHex(stringToBytes(cantonParty));
}

// ---------------------------------------------------------------------------
// Wallet helpers
// ---------------------------------------------------------------------------

export function hasInjectedWallet(): boolean {
  return typeof window !== 'undefined' && !!(window as { ethereum?: unknown }).ethereum;
}

export async function getEvmAddress(): Promise<`0x${string}` | null> {
  if (!hasInjectedWallet()) return null;
  const eth = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
  const accounts = await eth.request({ method: 'eth_requestAccounts' });
  return (accounts?.[0] as `0x${string}`) ?? null;
}

export async function switchToChain(chain: XReserveSource): Promise<void> {
  const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!eth) throw new Error('No injected wallet found');
  const chainId = `0x${XRESERVE_CHAINS[chain].chainId.toString(16)}`;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) throw new Error(`Chain ${chain} not added to wallet`);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getUsdcBalance(
  chain: XReserveSource,
  owner: `0x${string}`,
): Promise<bigint> {
  const cfg = XRESERVE_CHAINS[chain];
  const client = createPublicClient({ chain: cfg.chain, transport: http() });
  return (await client.readContract({
    address: cfg.usdcContract,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [owner],
  })) as bigint;
}

export async function getUsdcAllowance(
  chain: XReserveSource,
  owner: `0x${string}`,
): Promise<bigint> {
  const cfg = XRESERVE_CHAINS[chain];
  const client = createPublicClient({ chain: cfg.chain, transport: http() });
  return (await client.readContract({
    address: cfg.usdcContract,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, cfg.xReserveContract],
  })) as bigint;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function approveUsdc(
  chain: XReserveSource,
  amount: bigint,
): Promise<`0x${string}`> {
  const cfg = XRESERVE_CHAINS[chain];
  await switchToChain(chain);
  const wallet = createWalletClient({
    chain: cfg.chain,
    transport: custom((window as unknown as { ethereum: unknown }).ethereum as never),
  });
  const [account] = await wallet.getAddresses();
  return wallet.writeContract({
    account,
    address: cfg.usdcContract,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [cfg.xReserveContract, amount],
  });
}

export async function depositToRemote(args: {
  chain: XReserveSource;
  amount: bigint;
  cantonParty: string;
  maxFee?: bigint;
}): Promise<`0x${string}`> {
  const cfg = XRESERVE_CHAINS[args.chain];
  await switchToChain(args.chain);
  const wallet = createWalletClient({
    chain: cfg.chain,
    transport: custom((window as unknown as { ethereum: unknown }).ethereum as never),
  });
  const [account] = await wallet.getAddresses();

  const remoteRecipient = encodeRecipientBytes32(args.cantonParty);
  const hookData = encodeHookData(args.cantonParty);

  return wallet.writeContract({
    account,
    address: cfg.xReserveContract,
    abi: X_RESERVE_ABI,
    functionName: 'depositToRemote',
    args: [
      args.amount,
      CANTON_DOMAIN,
      remoteRecipient,
      cfg.usdcContract,
      args.maxFee ?? 0n,
      hookData,
    ],
  });
}

export async function waitForTx(
  chain: XReserveSource,
  hash: `0x${string}`,
): Promise<void> {
  const cfg = XRESERVE_CHAINS[chain];
  const client = createPublicClient({ chain: cfg.chain, transport: http() });
  await client.waitForTransactionReceipt({ hash, confirmations: 1 });
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function parseUsdc(amount: string | number): bigint {
  return parseUnits(String(amount), 6);
}

export function formatUsdc(wei: bigint): string {
  const whole = wei / 1_000_000n;
  const frac = wei % 1_000_000n;
  return frac === 0n
    ? whole.toString()
    : `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}
