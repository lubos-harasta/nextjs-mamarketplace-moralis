/**
 * This script is for setting Moralis server for listenting to our events of the given smart contract
 */

const Moralis = require("moralis/node")
require("dotenv").config()
const contractAddresses = require("./constants/networkMapping.json") // to get address of deployed smart contraxcts
let chainId = process.env.chainId || 31337 // get the localhost chainId
let moralisChainId = chainId == "31337" ? "1337" : chainId // Moralis takes 1337 as localchain/devchain
const basicNftAddress = contractAddresses[chainId]["BasicNft"][0] // grab the first address

// see more info at: https://docs.moralis.io/moralis-dapp/connect-the-sdk/connect-using-node

async function main() {
    // get params to connect to the Moralis server
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
    const appId = process.env.NEXT_PUBLIC_APP_ID
    const masterKey = process.env.moralisMasterKey

    await Moralis.start({ serverUrl, appId, masterKey })
    console.log(`Working with the contract ${basicNftAddress}`)

    // define events to be listened
    let nftMintedOptions = {
        chainId: moralisChainId,
        address: basicNftAddress,
        sync_historical: true,
        topic: "NftMinted(uint256,address)",
        abi: {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: "uint256",
                    name: "tokenId",
                    type: "uint256",
                },
                {
                    indexed: true,
                    internalType: "address",
                    name: "to",
                    type: "address",
                },
            ],
            name: "NftMinted",
            type: "event",
        },
        tableName: "NftMinted",
    }

    // set the listening
    const listedResponse = await Moralis.Cloud.run("watchContractEvent", nftMintedOptions, {
        useMasterKey: true,
    })

    // reassure that everything went okay
    if (listedResponse.success) {
        console.log("Success! Database Updated with watching events")
    } else {
        console.log("Something went wrong...")
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
