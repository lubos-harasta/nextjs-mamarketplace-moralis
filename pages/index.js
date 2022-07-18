import Image from "next/image"
import styles from "../styles/Home.module.css"
import { useMoralisQuery, useMoralis } from "react-moralis" // more details at: https://github.com/MoralisWeb3/react-moralis#usemoralisquery
import NFTBox from "../components/NFTBox"

export default function Home() {
    const { isWeb3Enabled } = useMoralis()
    const { data: listedNfts, isFetching: fetchingListedNfts } = useMoralisQuery(
        // the first param. is the name of the table
        "ActiveItem",
        // the second param. is function
        (query) => query.limit(10).descending("tokenId")
    )
    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Currently listed NFTs</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    fetchingListedNfts ? (
                        <div>Loading NFTs...</div>
                    ) : (
                        listedNfts.map((nft) => {
                            console.log(nft.attributes)
                            const { price, nftAddress, tokenId, marketplaceAddress, seller } =
                                nft.attributes
                            return (
                                <div>
                                    <NFTBox
                                        price={price}
                                        nftAddress={nftAddress}
                                        tokenId={tokenId}
                                        marketplaceAddress={marketplaceAddress}
                                        seller={seller}
                                        key={`${nftAddress}${tokenId}`} // there is a need to have unique key for each mapping
                                    />
                                </div>
                            )
                        })
                    )
                ) : (
                    <div className="font-bold">
                        To see currently listed NFTs connect your Web3 Wallet first!
                    </div>
                )}
            </div>
        </div>
    )
}
