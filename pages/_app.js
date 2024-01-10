import "@/styles/globals.css"
import Head from "next/head"
import { MoralisProvider } from "react-moralis"
import Header from "../components/Header"

export default function App({ Component, pageProps }) {
    return (
        <div className="bg-black h-screen w-full">
            <Head>
                <title>Base Front Web3 Project</title>
                <meta
                    name="description"
                    content="Starting point to create a front web3 project"
                />
            </Head>
            <MoralisProvider initializeOnMount={false}>
                <Header />
                <Component {...pageProps} />
            </MoralisProvider>
        </div>
    )
}
