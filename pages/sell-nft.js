import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form, useNotification } from "web3uikit"
import { ethers } from "ethers"
import NFTBox2 from "../components/NFTBox2"

import { useMoralis, useWeb3Contract, useMoralisQuery } from "react-moralis"

import networkMapping from "../constants/networkMapping.json"
import basicNftAbi from "../constants/BasicNft.json"
import marketplaceAbi from "../constants/NftMarketplace.json"
import { useEffect } from "react"

export default function Home() {
    const { chainId: chainIdHex, account, isWeb3Enabled } = useMoralis() // chainId is imported in Hex format
    const chainIdStr = chainIdHex ? parseInt(chainIdHex).toString() : "31337" // if localhost, Moralis returns 1377 instead of 31377
    const marketplaceAddress = networkMapping[chainIdStr]["NftMarketplace"][0] // get the first value

    const dispatch = useNotification()
    const { runContractFunction } = useWeb3Contract()

    async function approveAndList(data) {
        console.log("Approving NFT...")
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether")

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
            abi: marketplaceAbi,
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
            message: "NFT listing",
            title: "NFT listed!",
            position: "topR",
            icon: "eth",
        })
    }

    let { data: usersNfts, isFetching: fetchingUsersNfts } = useMoralisQuery(
        // the first param. is the name of the table
        "NftOwners",
        // the second param. is function
        (query) => query.equalTo("owner", account).limit(100).descending("tokenId"),
        [isWeb3Enabled, account]
    )

    return (
        <div className={styles.container}>
            <h1 className="py-4 px-4 font-bold text-2xl">Your NFTs</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    fetchingUsersNfts ? (
                        <div>Loading NFTs...</div>
                    ) : (
                        usersNfts.map((nft) => {
                            console.log(nft.attributes)
                            const { nftAddress, tokenId, owner } = nft.attributes
                            return (
                                <div>
                                    <NFTBox2
                                        nftAddress={nftAddress}
                                        tokenId={tokenId}
                                        key={`${nftAddress}${tokenId}`} // there is a need to have unique key for each mapping
                                    />
                                </div>
                            )
                        })
                    )
                ) : (
                    <div className="font-bold">
                        To see your NFTs connect your Web3 Wallet first!
                    </div>
                )}
            </div>
            <h1 className="py-4 px-4 font-bold text-2xl">If you do not see your NFTs above, you can list them manually:</h1>
            <Form
                onSubmit={approveAndList}
                data={[
                    {
                        name: "NFT Address",
                        type: "text",
                        inputWidth: "50%",
                        value: "",
                        key: "nftAddress",
                    },
                    {
                        name: "Token ID",
                        type: "number",
                        value: "",
                        key: "tokenId",
                    },
                    {
                        name: "Price (in ETH)",
                        type: "number",
                        value: "",
                        key: "price",
                    },
                ]}
                title="Sell your NFT!"
                id="Main Form"
            />
        </div>
    )
}
