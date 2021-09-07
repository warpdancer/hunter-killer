import { ethers,providers, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

const CHAIN_ID = 5;
const provider = new providers.InfuraProvider(CHAIN_ID)

// stuff that we populate
// @TODO move off to a different file or command prompt for this shit
const FLASHBOTS_ENDPOINT = "https://relay-goerli.flashbots.net";
const CONTRACT_ADDRESS = "0x20EE855E43A7af19E407E39E5110c2C1Ee41F64D";
const CONTRACT_TYPE = 2;

// passed through command line
if (process.env.WALLET_PRIVATE_KEY === undefined) {
  console.error("WALLET_PRIVATE_KEY is empty. Please pass the private key.")
  process.exit(1)
}

// create new wallet
const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)

// @TODO change to bignumbers.js
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n

// entry point
async function main() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom(), FLASHBOTS_ENDPOINT)
  provider.on('block', async (blockNumber) => {
    console.log('Block Number: ', blockNumber)

    let gasPrice = await provider.getGasPrice();
    
    // send transaction, as many as you want
    // will automatically estimate gas
    const bundleSubmitResponse = await flashbotsProvider.sendBundle(
      [
        {
          transaction: {
            chainId: CHAIN_ID,
            type: CONTRACT_TYPE,
            value: ETHER / 100n * 3n,
            data: "0x1249c58b",
            maxFeePerGas: GWEI * 3n,
            maxPriorityFeePerGas: GWEI * 2n,
            to: CONTRACT_ADDRESS
          },
          signer: wallet
        }
      ], blockNumber + 1
    )

    // By exiting this function (via return) when the type is detected as a "RelayResponseError", TypeScript recognizes bundleSubmitResponse must be a success type object (FlashbotsTransactionResponse) after the if block.
    if ('error' in bundleSubmitResponse) {
      console.warn(bundleSubmitResponse.error.message)
      return
    }

    console.log(await bundleSubmitResponse.simulate())
  })
}

main();