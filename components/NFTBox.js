import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "../components/UpdateListingModal" // in our _app.js we need to have </NotificationProvider> wrapper to have context here

import basicNftAbi from "../constants/BasicNft.json"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"

const truncateString = (fullStr, strLen) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."
    const separatorLength = separator.length
    const charsToShow = strLen - separatorLength
    const fronChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return (
        fullStr.substring(0, fronChars) + separator + fullStr.substring(fullStr.length - backChars)
    )
}

export default function NFTBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [showModal, setShowModal] = useState(false)
    const hideModal = () => setShowModal(false)
    const dispatch = useNotification()

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: basicNftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId, // from smart contract
        },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    async function updateUI() {
        const tokenURI = await getTokenURI()
        console.log(`Token URI: ${tokenURI}`)
        if (tokenURI) {
            /** TODO: Another options to make it better:
             * 1) use moralis server hooks (useNFTBalances) but they do not work on localhost
             * 2) to render the image on out server and just call our server
             * 3) call directly ipfs but it is not widely adopted yet
             */
            // native ipfs url is not yet adopted broadly, thus using the ipfs gateway ("a normal url")
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            // first fetch the URL, then get the URL metadata and return it in JSON:
            const tokenURIResponse = await (await fetch(requestURL)).json()
            // get image URL
            const imageURI = tokenURIResponse.image
            // use (again) the IPFS gateway
            const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            // set image URL
            setImageURI(imageURIURL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
        }
    }

    useEffect(() => {
        // run updateUI() only if user wallet is connected
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const isOwnerByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnerByUser
        ? "You are the owner!"
        : truncateString(seller || "", 15)

    const handleCardClick = () => {
        isOwnerByUser
            ? setShowModal(true)
            : buyItem({
                  onError: (error) => console.log(error),
                  onSuccess: handleBuyItemSuccess,
              })
    }

    const handleBuyItemSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Item bought!",
            title: "Item Bought",
            position: "topR",
            icon: "eth",
        })
    }

    return (
        <div>
            <div>
                {imageURI ? (
                    <div>
                        <UpdateListingModal
                            isVisible={showModal}
                            tokenId={tokenId}
                            marketplaceAddress={marketplaceAddress}
                            nftAddress={nftAddress}
                            onClose={hideModal}
                        />
                        <Card
                            title={tokenName}
                            description={tokenDescription}
                            onClick={handleCardClick}
                        >
                            <div className="p-2">
                                <div className="flex flex-col items-center gap-2">
                                    <div>Token ID: #{tokenId}</div>
                                    <div className="italic text-sm">
                                        Owner: {formattedSellerAddress}
                                    </div>
                                    <Image
                                        loader={() => imageURI}
                                        src={imageURI}
                                        height="200"
                                        width="200"
                                    />
                                    <div className="font-bold">
                                        {ethers.utils.formatUnits(price, "ether")} ETH
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div>Loading NFTs...</div>
                )}
            </div>
        </div>
    )
}
