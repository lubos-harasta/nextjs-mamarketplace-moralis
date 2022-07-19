import styles from "../styles/Home.module.css"
import { Button, useNotification } from "web3uikit"
import { useWeb3Contract, useMoralis } from "react-moralis"

import { useEffect } from "react"

import networkMapping from "../constants/networkMapping.json"
import basicNftAbi from "../constants/BasicNft.json"

export default function Home() {
    const { runContractFunction } = useWeb3Contract()
    const { isWeb3Enabled, chainId: chainIdHex } = useMoralis()
    const chainIdStr = chainIdHex ? parseInt(chainIdHex).toString() : "31337"
    const basicNftAddress = networkMapping[chainIdStr].BasicNft[0]
    const dispatch = useNotification()

    async function mintNFT() {
        console.log("Minting NFT...")
        const mintNftOptions = {
            abi: basicNftAbi,
            contractAddress: basicNftAddress,
            functionName: "mintNft",
            params: {},
        }

        await runContractFunction({
            params: mintNftOptions,
            onSuccess: handleMintedNft,
            onError: (error) => console.log(error),
        })
    }

    const handleMintedNft = async (tx) => {
        const mintingReceipt = await tx.wait(1)
        console.log(mintingReceipt)
        dispatch({
            type: "success",
            message: "NFT has been minted!",
            title: "NFT minting",
            position: "topR",
            icon: "eth",
        })
    }

    return (
        <div className={styles.container}>
            <h1 className="py-4 px-4 font-bold text-2xl">Mint MAMA NFT!</h1>
            {isWeb3Enabled ? (
                <div>
                    <Button
                        text="Mint NFT"
                        size="large"
                        theme="colored"
                        onClick={mintNFT}
                        color="green"
                        type="button"
                    ></Button>
                </div>
            ) : (
                <div className="py-4 px-4 font-bold text-2xl">Please connect your wallet!</div>
            )}
        </div>
    )
}
