import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form } from "web3uikit"

export default function Home() {
    return (
        <div className={styles.container}>
            <Form
                data={[
                    {
                        name: "NFT Address",
                        type: "text",
                    },
                ]}
            ></Form>
            Sell Page
        </div>
    )
}
