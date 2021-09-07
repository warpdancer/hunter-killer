import { providers, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

const CHAIN_ID = 5;
const provider = new providers.InfuraProvider(CHAIN_ID)

// stuff that we populate
const FLASHBOTS_ENDPOINT = "https://relay.flashbots.net";
const CONTRACT_ADDRESS = "0xf497253C2bB7644ebb99e4d9ECC104aE7a79187A";
const CONTRACT_TYPE = 2;

if (process.env.WALLET_PRIVATE_KEY === undefined) {
  console.error("Please provide WALLET_PRIVATE_KEY env")
  process.exit(1)
}
const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n

async function main() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom(), FLASHBOTS_ENDPOINT)
  provider.on('block', async (blockNumber) => {
    console.log(blockNumber)
    
    // send transaction, as many as you want
    // will automatically estimate gas
    const bundleSubmitResponse = await flashbotsProvider.sendBundle(
      [
        {
          transaction: {
            chainId: CHAIN_ID,
            type: CONTRACT_TYPE,
            value: ETHER / 100n * 7n,
            data: "0x97304ced0000000000000000000000000000000000000000000000000000000000000001",
            maxFeePerGas: GWEI * 3n,
            maxPriorityFeePerGas: GWEI * 2n,
            to: CONTRACT_ADDRESS
          },
          signer: wallet
        }
      ], blockNumber + 1
    )

    console.log("NFT cost: " + ETHER / 100n * 7n + "\n")

    // By exiting this function (via return) when the type is detected as a "RelayResponseError", TypeScript recognizes bundleSubmitResponse must be a success type object (FlashbotsTransactionResponse) after the if block.
    if ('error' in bundleSubmitResponse) {
      console.warn(bundleSubmitResponse.error.message)
      return
    }

    console.log(await bundleSubmitResponse.simulate())
  })
}

main();