import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "../components/UpdateListingModal" // in our _app.js we need to have </NotificationProvider> wrapper to have context here
import ListingModal from "../components/ListingModal"

import basicNftAbi from "../constants/BasicNft.json"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import networkMapping from "../constants/networkMapping.json"

export default function NFTBox2({ nftAddress, tokenId }) {
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [isListed, setIsListed] = useState(false)
    const [price, setPrice] = useState("0")

    const [showListingModal, setShowListingModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)

    const hideListingModal = () => setShowListingModal(false)
    const hideUpdateModal = () => setShowUpdateModal(false)

    const dispatch = useNotification()

    const chainIdStr = chainIdHex ? parseInt(chainIdHex).toString() : "31337" // if localhost, Moralis returns 1377 instead of 31377
    const marketplaceAddress = networkMapping[chainIdStr]["NftMarketplace"][0] // get the first value

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: basicNftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId, // from smart contract
        },
    })

    const { runContractFunction: getListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "getListing",
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
        const listing = await getListing()
        listing[0] > 0 ? setIsListed(true) : setIsListed(false)
        listing[0] > 0 ? setPrice(listing[0].toString()) : setPrice("0")
        // const isListed = listing[0] > 0 ? true : false

        console.log(`NFT on address ${nftAddress} with tokenId #${tokenId} is listed: ${isListed}`)
    }

    useEffect(() => {
        // run updateUI() only if user wallet is connected
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled, account, isListed])

    const handleCardClick = () => {
        isListed === true ? setShowUpdateModal(true) : setShowListingModal(true)
    }

    return (
        <div>
            <div>
                {imageURI ? (
                    <div>
                        <UpdateListingModal
                            isVisible={showUpdateModal}
                            tokenId={tokenId}
                            nftAddress={nftAddress}
                            onClose={hideUpdateModal}
                        />
                        <ListingModal
                            isVisible={showListingModal}
                            marketplaceAddress={marketplaceAddress}
                            nftAddress={nftAddress}
                            tokenId={tokenId}
                            onClose={hideListingModal}
                        />
                        <Card
                            title={tokenName}
                            description={tokenDescription}
                            onClick={handleCardClick}
                        >
                            <div className="p-2">
                                <div className="flex flex-col items-center gap-2">
                                    <div>Token ID: #{tokenId}</div>
                                    <Image
                                        loader={() => imageURI}
                                        src={imageURI}
                                        height="200"
                                        width="200"
                                    />
                                    {isListed ? (
                                        <div>{ethers.utils.formatUnits(price, "ether")} ETH</div>
                                    ) : (
                                        <div>Not listed</div>
                                    )}
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
