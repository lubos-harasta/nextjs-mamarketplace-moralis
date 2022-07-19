import { Modal, Input, useNotification } from "web3uikit"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { useState } from "react"
import { ethers } from "ethers"

import basicNftAbi from "../constants/BasicNft.json"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import networkMapping from "../constants/networkMapping.json"

export default function ListingModal({ nftAddress, tokenId, isVisible, onClose }) {
    const { chainId: chainIdHex, account, isWeb3Enabled } = useMoralis() // chainId is imported in Hex format
    const chainIdStr = chainIdHex ? parseInt(chainIdHex).toString() : "31337" // if localhost, Moralis returns 1377 instead of 31377
    const marketplaceAddress = networkMapping[chainIdStr]["NftMarketplace"][0] // get the first value

    const [listingPrice, setListingPrice] = useState(0)

    const dispatch = useNotification()
    const { runContractFunction } = useWeb3Contract()

    async function approveAndList() {
        console.log("Approving NFT...")
        const price = ethers.utils.parseEther(listingPrice || "0")

        // get approve params for approve function
        const approveOptions = {
            abi: basicNftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        }
        // run approve function
        await runContractFunction({
            params: approveOptions,
            onSuccess: () => handleApproveSuccess(nftAddress, tokenId, price),
            onError: (error) => console.log(error),
        })
    }

    async function handleApproveSuccess(nftAddress, tokenId, price) {
        console.log("Listing NFT...")
        dispatch({
            type: "success",
            message: "NFT approve",
            title: "NFT approved!",
            position: "topR",
            icon: "eth",
        })

        const listingOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }
        await runContractFunction({
            params: listingOptions,
            onSuccess: handleListingSuccess,
            onError: (error) => console.log(error),
        })
    }

    async function handleListingSuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Listing updated - please refresh!",
            title: "Listing updated!",
            position: "topR",
            icon: "eth",
        })
        onClose && onClose()
        setListingPrice("0") // to reset the state
    }

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() => {
                approveAndList({
                    onError: (error) => console.log(error),
                    onSuccess: handleListingSuccess,
                })
            }}
        >
            <Input
                label="Set listing price in L1 currency (ETH)"
                name="Listing price"
                type="number"
                onChange={(event) => {
                    setListingPrice(event.target.value)
                }}
            />
        </Modal>
    )
}
