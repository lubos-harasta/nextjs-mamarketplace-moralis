import styles from "../styles/Home.module.css"
import { ethers } from "ethers"
import { Button, useNotification } from "web3uikit"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { useState, useEffect } from "react"

import networkMapping from "../constants/networkMapping.json"
import marketplaceAbi from "../constants/NftMarketplace.json"

export default function Home() {
    const [proceeds, setProceeds] = useState("0")

    const { chainId: chainIdHex, account, isWeb3Enabled } = useMoralis() // chainId is imported in Hex format
    const chainIdStr = chainIdHex ? parseInt(chainIdHex).toString() : "31337" // if localhost, Moralis returns 1377 instead of 31377
    const marketplaceAddress = networkMapping[chainIdStr]["NftMarketplace"][0] // get the first value

    const { runContractFunction } = useWeb3Contract()
    const dispatch = useNotification()

    async function setupUI() {
        const getProceedsOptions = {
            abi: marketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "getProceeds",
            params: {
                seller: account,
            },
        }
        const proceedsReturned = await runContractFunction({
            params: getProceedsOptions,
            onError: (error) => console.log(error),
        })

        if (proceedsReturned) {
            setProceeds(proceedsReturned.toString())
            console.log(ethers.utils.formatUnits(proceeds, "ether"))
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            setupUI()
        }
    }, [isWeb3Enabled, account, proceeds, chainIdHex])

    async function withdrawProceeds() {
        console.log("Withdrawing proceeds")
        const withdrawProceedsOptions = {
            abi: marketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "withdrawProceeds",
            params: {},
        }
        await runContractFunction({
            params: withdrawProceedsOptions,
            onSuccess: handleProceedsWithdrawal,
            onError: (e) => console.log(e),
        })
        setProceeds("0") // to reset state
    }

    const handleProceedsWithdrawal = async (tx) => {
        dispatch({
            type: "success",
            message: "Proceeds sucessfully have been withdrawn!",
            title: "Proceeds withdrawal",
            position: "topR",
            icon: "eth",
        })
    }

    const proceedsToDisplay = proceeds != "0" ? ethers.utils.formatUnits(proceeds, "ether") : "0"
    const buttonDisabled = proceeds != "0" ? false : true
    const buttonColor = proceeds != "0" ? "green" : "red"

    return (
        <div className={styles.container}>
            <h1 className="py-4 px-4 font-bold text-2xl">Your Proceeds</h1>
            <div className="font-bold py-4 px-4">You can withdraw {proceedsToDisplay} ETH</div>
            <Button
                text="Withdraw proceeds"
                size="large"
                theme="colored"
                onClick={withdrawProceeds}
                disabled={buttonDisabled}
                color={buttonColor}
                type="button"
            ></Button>
        </div>
    )
}
