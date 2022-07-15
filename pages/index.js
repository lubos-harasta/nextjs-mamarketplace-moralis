import Image from "next/image"
import styles from "../styles/Home.module.css"

export default function Home() {
    // index the events off-chain and then read them from our database
    // -> setup a server to listen for those events to be fired
    return <div className={styles.container}>Hi!</div>
}
