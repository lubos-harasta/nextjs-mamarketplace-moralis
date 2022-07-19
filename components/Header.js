import { ConnectButton } from "web3uikit"
import Link from "next/link"

export default function Header() {
    return (
        <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
            <h1 className="py-4 px-4 font-bold text-3xl">MAMA NFT Playground</h1>
            <div className="flex flex-row items-center">
                <Link href="/">
                    <a className="mr-4 p-6">Marketplace</a>
                </Link>
                <Link href="/sell-nft">
                    <a className="mr-4 p-6">Sell NFT</a>
                </Link>
                <Link href="/withdraw-proceeds">
                    <a className="mr-4 p-6">Proceeds</a>
                </Link>
                <Link href="/mint-nft">
                    <a className="mr-4 p-6">Mint NFT</a>
                </Link>
                <Link href="/FAQ">
                    <a className="mr-4 p-6">FAQ</a>
                </Link>
                <ConnectButton moralisAuth={false} />
            </div>
        </nav>
    )
}
