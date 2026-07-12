# CompraBTC contracts

Foundry project for `DCAExecutor.sol` — the non-custodial DCA executor. Users approve USDT and create a plan with on-chain limits (amount per run, minimum interval); a keeper triggers each installment: USDT is pulled from the user's wallet, swapped USDT→WBTC on Uniswap V3, and the WBTC is sent straight back to the user. The contract never holds user funds between executions.

## Deployment (Celo mainnet)

| | Address |
|---|---|
| **DCAExecutor** (verified) | [`0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189`](https://celoscan.io/address/0xd03ffeBBCaaA8aA21053eEB0EeAde39EFC504189) |
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| SwapRouter02 | `0x5615CDAb10dc425a742d643d949a7F474C01abc4` |

Deployed with `feeBps = 100` (1%) and `feeFlat = 5000` ($0.005). On-chain hard caps: `MAX_FEE_BPS = 100`, `MAX_FEE_FLAT = 50000` ($0.05); `execute` reverts if the fee would reach the installment amount.

## Usage

```shell
forge build
forge test                                  # unit tests
forge test --fork-url https://forno.celo.org  # includes mainnet fork tests (real pool swap)
```

## Deploy

```shell
export KEEPER_ADDRESS=0x...      # EOA that executes plans
export TREASURY_ADDRESS=0x...    # protocol fee recipient
export CELOSCAN_API_KEY=...      # verification (Etherscan V2 API)
forge script script/Deploy.s.sol --rpc-url celo --broadcast --verify \
  --interactives 1               # paste the deployer private key at the prompt
```
