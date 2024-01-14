import React, { useState, useEffect } from "react"
import { useMoralis } from "react-moralis"
import { useWeb3Contract } from "react-moralis"
import {
    qiteSwapAbi,
    qiteAddress,
    erc20Abi,
    qitePoolAbi,
} from "../constants/qite-dex-constants"
import { ethers } from "ethers"

const Swap = () => {
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [amount, setAmount] = useState("0")
    const [expectedAmount, setExpectedAmount] = useState("0")
    const [pools, setPools] = useState([])
    const [tokens, setTokens] = useState([])
    const [selectedPool, setSelectedPool] = useState("")
    const [selectedToken1, setSelectedToken1] = useState("")
    const [selectedToken2, setSelectedToken2] = useState("")
    const [token1Balance, setToken1Balance] = useState("0")
    const [token2Balance, setToken2Balance] = useState("0")
    const [lpToken1Balance, setLpToken1Balance] = useState("0")
    const [lpToken2Balance, setLpToken2Balance] = useState("0")
    const qiteContractAddress =
        chainId in qiteAddress ? qiteAddress[chainId].qiteSwap : null

    const { runContractFunction: getPairs } = useWeb3Contract({
        abi: qiteSwapAbi,
        contractAddress: qiteContractAddress,
        functionName: "getPairs",
        params: {},
    })

    const { runContractFunction: getAddressToken1 } = useWeb3Contract({
        abi: qitePoolAbi,
        contractAddress: selectedPool,
        functionName: "token1",
    })

    const { runContractFunction: getAddressToken2 } = useWeb3Contract({
        abi: qitePoolAbi,
        contractAddress: selectedPool,
        functionName: "token2",
    })

    const { runContractFunction: estimateOutputAmountToken1 } = useWeb3Contract(
        {
            abi: qitePoolAbi,
            contractAddress: selectedPool,
            functionName: "estimateOutputAmountToken1",
        }
    )

    const { runContractFunction: estimateOutputAmountToken2 } = useWeb3Contract(
        {
            abi: qitePoolAbi,
            contractAddress: selectedPool,
            functionName: "estimateOutputAmountToken2",
        }
    )

    const { runContractFunction: swap } = useWeb3Contract({
        abi: qitePoolAbi,
        contractAddress: selectedPool,
        functionName: "swapTokens",
    })

    const { runContractFunction: getAllowance } = useWeb3Contract({
        abi: erc20Abi,
        contractAddress: "",
        functionName: "allowance",
    })

    const { runContractFunction: approve } = useWeb3Contract({
        abi: erc20Abi,
        contractAddress: "",
        functionName: "approve",
    })

    const { runContractFunction: getBalanceOf } = useWeb3Contract({
        abi: erc20Abi,
        contractAddress: "",
        functionName: "balanceOf",
    })

    useEffect(() => {
        if (isWeb3Enabled) {
            const fetchPools = async () => {
                const pairs = await getPairs()
                if (pairs) {
                    setPools(pairs)
                }
            }

            fetchPools()
        }
    }, [isWeb3Enabled])

    useEffect(() => {
        if (selectedToken1 && selectedToken2 && selectedPool) {
            const fetchTokenAmount = async () => {
                const balanceToken1 = await getBalanceOf({
                    params: {
                        contractAddress: selectedToken1,
                        params: {
                            account: account,
                        },
                    },
                })
                const balanceToken2 = await getBalanceOf({
                    params: {
                        contractAddress: selectedToken2,
                        params: {
                            account: account,
                        },
                    },
                })
                const lpBalanceToken1 = await getBalanceOf({
                    params: {
                        contractAddress: selectedToken1,
                        params: {
                            account: selectedPool,
                        },
                    },
                })
                const lpBalanceToken2 = await getBalanceOf({
                    params: {
                        contractAddress: selectedToken2,
                        params: {
                            account: selectedPool,
                        },
                    },
                })
                setToken1Balance(ethers.utils.formatEther(balanceToken1))
                setToken2Balance(ethers.utils.formatEther(balanceToken2))
                setLpToken1Balance(ethers.utils.formatEther(lpBalanceToken1))
                setLpToken2Balance(ethers.utils.formatEther(lpBalanceToken2))
            }

            fetchTokenAmount()
        }
    }, [selectedToken1])

    useEffect(() => {
        if (selectedPool) {
            const fetchTokens = async () => {
                const token1Address = await getAddressToken1({
                    params: {
                        contractAddress: selectedPool,
                    },
                })
                const token2Address = await getAddressToken2({
                    params: {
                        contractAddress: selectedPool,
                    },
                })
                setTokens([token1Address, token2Address])
                setSelectedToken1(token1Address)
                setSelectedToken2(token2Address)
            }
            fetchTokens()
        }
    }, [selectedPool])

    const handleSwap = async () => {
        try {
            // Implement your token swap logic using Moralis or other DEX protocols
            console.log(
                `Swapping ${amount} ${selectedToken1} for ${selectedToken2}`
            )
            const isTokenApproved = await checkAllowance(
                selectedToken1,
                account,
                selectedPool,
                ethers.utils.parseEther(amount)
            )
            if (!isTokenApproved) {
                // Trigger approval requests if allowances are insufficient
                await requestApprovals(
                    isTokenApproved,
                    selectedToken1,
                    selectedPool,
                    ethers.utils.parseEther(amount),
                    ethers.utils.parseEther(expectedAmount),
                    selectedToken2
                )
            } else {
                // If allowances are sufficient, trigger the swap function
                await triggerSwap(
                    selectedToken1,
                    selectedToken2,
                    ethers.utils.parseEther(amount),
                    ethers.utils.parseEther(expectedAmount)
                )
            }
        } catch (error) {
            console.error("Swap failed:", error)
        }
    }

    const checkAllowance = async (tokenAddress, owner, spender, amount) => {
        const allowance = await getAllowance({
            params: {
                contractAddress: tokenAddress,
                params: {
                    owner: owner,
                    spender: spender,
                },
            },
        })
        if (allowance.gt(amount)) {
            return true
        }
        return false
    }

    const requestApprovals = async (
        isTokenApproved,
        tokenAddress,
        spender,
        amountToken1,
        amountToken2,
        token2Address
    ) => {
        try {
            // Request approvals for ERC20 tokens if needed
            if (!isTokenApproved) {
                await approve({
                    params: {
                        contractAddress: tokenAddress,
                        params: {
                            spender: spender,
                            value: amountToken1,
                        },
                    },
                    onError: async (err) => {
                        console.log(err)
                    },
                })
            }

            // After approvals, trigger the swap function
            await triggerSwap(
                tokenAddress,
                token2Address,
                amountToken1,
                amountToken2
            )
        } catch (error) {
            console.error("Error requesting approvals:", error)
        }
    }

    const triggerSwap = async (
        token1Address,
        token2Address,
        amountToken1,
        amountToken2
    ) => {
        try {
            // Trigger the swap function
            await swap({
                params: {
                    contractAddress: selectedPool,
                    params: {
                        fromToken: token1Address,
                        toToken: token2Address,
                        amountIn: amountToken1,
                        amountOut: amountToken2.sub(1),
                        to: account,
                    },
                },
                onError: async (err) => {
                    console.log(err)
                },
            })
        } catch (error) {
            console.error("Error adding liquidity:", error)
        }
    }

    return (
        <div className="max-w-lg mx-auto mt-8 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Token Swap</h2>
            {isWeb3Enabled ? (
                <div>
                    <p className="mb-4">Welcome, {account}!</p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Select Pool:
                        </label>
                        <select
                            value={selectedPool}
                            onChange={(e) => setSelectedPool(e.target.value)}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        >
                            {/* Render available pools as options */}
                            {pools.map((pool) => (
                                <option key={pool} value={pool}>
                                    {pool}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token From:
                        </label>
                        <select
                            value={selectedToken1}
                            onChange={(e) => {
                                if (tokens && tokens.length > 1) {
                                    setSelectedToken1(e.target.value)
                                    if (tokens[0] == e.target.value) {
                                        setSelectedToken2(tokens[1])
                                    } else {
                                        setSelectedToken2(tokens[0])
                                    }
                                }
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        >
                            {/* Render available tokens as options */}
                            {tokens.map((token) => (
                                <option key={token} value={token}>
                                    {token}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token To:
                        </label>
                        <select
                            value={selectedToken2}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            disabled={true}
                        >
                            {tokens.map((token) => (
                                <option key={token} value={token}>
                                    {token}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Amount:
                        </label>
                        <input
                            type="text"
                            value={amount}
                            onChange={async (e) => {
                                setAmount(e.target.value)
                                if (e.target.value > 0) {
                                    if (selectedToken1 == tokens[0]) {
                                        const estimatedOutput =
                                            await estimateOutputAmountToken1({
                                                params: {
                                                    contractAddress:
                                                        selectedPool,
                                                    params: {
                                                        amountIn:
                                                            ethers.utils.parseEther(
                                                                e.target.value
                                                            ),
                                                    },
                                                },
                                            })
                                        setExpectedAmount(
                                            ethers.utils.formatEther(
                                                estimatedOutput
                                            )
                                        )
                                    } else {
                                        const estimatedOutput =
                                            await estimateOutputAmountToken2({
                                                params: {
                                                    contractAddress:
                                                        selectedPool,
                                                    params: {
                                                        amountIn:
                                                            ethers.utils.parseEther(
                                                                e.target.value
                                                            ),
                                                    },
                                                },
                                            })
                                        setExpectedAmount(
                                            ethers.utils.formatEther(
                                                estimatedOutput
                                            )
                                        )
                                    }
                                } else {
                                    setExpectedAmount("0")
                                }
                            }}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Expected Amount:
                        </label>
                        <input
                            type="text"
                            value={expectedAmount}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            disabled={true}
                        />
                    </div>
                    <button
                        onClick={handleSwap}
                        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                    >
                        Swap
                    </button>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            My Token 1 Balance : {token1Balance}
                        </label>
                        <label className="block text-sm font-medium text-gray-600">
                            My Token 2 Balance : {token2Balance}
                        </label>
                        <label className="block text-sm font-medium text-gray-600">
                            Liquidity Pool Token 1 Balance : {lpToken1Balance}
                        </label>
                        <label className="block text-sm font-medium text-gray-600">
                            Liquidity Pool Token 2 Balance : {lpToken2Balance}
                        </label>
                    </div>
                </div>
            ) : (
                <div>Please log in !</div>
            )}
        </div>
    )
}

export default Swap
