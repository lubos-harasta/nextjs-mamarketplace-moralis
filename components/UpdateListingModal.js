import { Modal, Input, useNotification } from "web3uikit"
import { useWeb3Contract } from "react-moralis"
import { useState } from "react"
import { ethers } from "ethers"

import nftMarketplaceAbi from "../constants/NftMarketplace.json"

export default function updateListingModal({
    marketplaceAddress,
    nftAddress,
    tokenId,
    isVisible,
    onClose,
}) {
    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)

    const dispatch = useNotification()
    const handleUpdateListingSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Listing updated!",
            title: "Listing updated - please refresh!",
            position: "topR",
            icon: "eth",
        })
        onClose && onClose()
        setPriceToUpdateListingWith("0") // to reset the state
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId, // from smart contract
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    })

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() => {
                updateListing({
                    onError: (error) => console.log(error),
                    onSuccess: handleUpdateListingSuccess,
                })
            }}
        >
            <Input
                label="Update listing price in L1 currency (ETH)"
                name="New listing price"
                type="number"
                onChange={(event) => {
                    setPriceToUpdateListingWith(event.target.value)
                }}
            />
        </Modal>
    )
}
