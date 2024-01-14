import React from "react"
import { useRouter } from "next/router"

const Home = () => {
    const router = useRouter()
    return (
        <main className="w-screen flex justify-center items-center">
            <div className="py-8 mx-32 flex justify-around w-full">
                <div>
                    <h1 className="text-white text-3xl font-bold">
                        My Beauty DEX
                    </h1>
                    <h3 className="text-white text-xl font-bold pt-8 my-12">
                        A decentralized exchange (DEX) is a type of
                        cryptocurrency exchange that operates without a central
                        authority or intermediary. Unlike traditional
                        centralized exchanges, DEXs facilitate peer-to-peer
                        trading of cryptocurrencies directly between users.
                    </h3>
                    <button
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-auto"
                        onClick={async function () {
                            router.push("/swap")
                        }}
                    >
                        <h1 className="text-white text-xl font-bold">Swap</h1>
                    </button>
                    <button
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-8"
                        onClick={async function () {
                            router.push("/pools")
                        }}
                    >
                        <h1 className="text-white text-xl font-bold">
                            Liquidity pools
                        </h1>
                    </button>
                </div>
            </div>
        </main>
    )
}

export default Home
