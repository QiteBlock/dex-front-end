import React, { useState, useEffect } from "react"
import { useMoralis } from "react-moralis"
import {
    qiteSwapAbi,
    qiteAddress,
    erc20Abi,
    qitePoolAbi,
} from "../constants/qite-dex-constants"
import { useWeb3Contract } from "react-moralis"
import CreateLPModal from "./CreateLPModal"
import { ethers } from "ethers"

const LiquidityPools = () => {
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [pools, setPools] = useState([])
    const [selectedPool, setSelectedPool] = useState("")
    const [liquidityAmountToken1, setLiquidityAmountToken1] = useState("0")
    const [liquidityAmountToken2, setLiquidityAmountToken2] = useState("0")
    const [liquidityToRemove, setLiquidityToRemove] = useState("0")
    const [liquidityAmount, setLiquidityAmount] = useState("0")
    const [isCreateLPModalOpen, setIsCreateLPModalOpen] = useState(false)
    const qiteContractAddress =
        chainId in qiteAddress ? qiteAddress[chainId].qiteSwap : null

    const { runContractFunction: getPairs } = useWeb3Contract({
        abi: qiteSwapAbi,
        contractAddress: qiteContractAddress,
        functionName: "getPairs",
        params: {},
    })

    const { runContractFunction: createLiquidityPool } = useWeb3Contract({
        abi: qiteSwapAbi,
        contractAddress: qiteContractAddress,
        functionName: "createPair",
    })

    const { runContractFunction: getLiquidityToken } = useWeb3Contract({
        abi: qitePoolAbi,
        contractAddress: selectedPool,
        functionName: "liquidityToken",
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

    const { runContractFunction: addLiquidity } = useWeb3Contract({
        abi: qitePoolAbi,
        contractAddress: selectedPool,
        functionName: "addLiquidity",
    })

    const { runContractFunction: removeLiquidity } = useWeb3Contract({
        abi: qitePoolAbi,
        contractAddress: selectedPool,
        functionName: "removeLiquidity",
    })

    const { runContractFunction: getBalanceOf } = useWeb3Contract({
        abi: erc20Abi,
        contractAddress: "",
        functionName: "balanceOf",
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
        if (selectedPool) {
            const fetchLiquidityAmount = async () => {
                const liquidityToken = await getLiquidityToken()
                if (liquidityToken) {
                    console.log("Liquidity token : " + liquidityToken)
                    const balance = await getBalanceOf({
                        params: {
                            contractAddress: liquidityToken,
                            params: {
                                account: account,
                            },
                        },
                    })
                    setLiquidityAmount(ethers.utils.formatEther(balance))
                }
            }

            fetchLiquidityAmount()
        }
    }, [selectedPool])

    const handleAddLiquidity = async () => {
        try {
            console.log(
                `Adding Token 1: ${liquidityAmountToken1} Token 2: ${liquidityAmountToken2} liquidity to ${selectedPool}`
            )
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
            console.log(token1Address + " ---- " + token2Address)
            // Check allowances for both ERC20 tokens
            const isToken1Approved = await checkAllowance(
                token1Address,
                account,
                selectedPool,
                ethers.utils.parseEther(liquidityAmountToken1)
            )
            console.log(isToken1Approved)
            const isToken2Approved = await checkAllowance(
                token2Address,
                account,
                selectedPool,
                ethers.utils.parseEther(liquidityAmountToken2)
            )
            if (!isToken1Approved || !isToken2Approved) {
                // Trigger approval requests if allowances are insufficient
                await requestApprovals(
                    isToken1Approved,
                    token1Address,
                    isToken2Approved,
                    token2Address,
                    selectedPool,
                    ethers.utils.parseEther(liquidityAmountToken1),
                    ethers.utils.parseEther(liquidityAmountToken2)
                )
            } else {
                // If allowances are sufficient, trigger the addLiquidity function
                await triggerAddLiquidity(
                    ethers.utils.parseEther(liquidityAmountToken1),
                    ethers.utils.parseEther(liquidityAmountToken2)
                )
            }
        } catch (error) {
            console.error("Add Liquidity failed:", error)
        }
    }

    const requestApprovals = async (
        isToken1Approved,
        token1Address,
        isToken2Approved,
        token2Address,
        spender,
        amountToken1,
        amountToken2
    ) => {
        try {
            // Request approvals for ERC20 tokens if needed
            console.log("here")
            if (!isToken1Approved) {
                await approve({
                    params: {
                        contractAddress: token1Address,
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
            if (!isToken2Approved) {
                await approve({
                    params: {
                        contractAddress: token2Address,
                        params: {
                            spender: spender,
                            value: amountToken2,
                        },
                    },
                    onError: async (err) => {
                        console.log(err)
                    },
                })
            }

            // After approvals, trigger the addLiquidity function
            await triggerAddLiquidity(amountToken1, amountToken2)
        } catch (error) {
            console.error("Error requesting approvals:", error)
        }
    }

    const triggerAddLiquidity = async (amount1, amount2) => {
        try {
            // Trigger the addLiquidity function
            await addLiquidity({
                params: {
                    contractAddress: selectedPool,
                    params: {
                        amount1: amount1,
                        amount2: amount2,
                    },
                },
                onError: async (err) => {
                    console.log(err)
                },
            })
            console.log("Add Liquidity result:")
        } catch (error) {
            console.error("Error adding liquidity:", error)
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

    const handleRemoveLiquidity = async () => {
        try {
            // Implement your remove liquidity logic using Moralis or other DEX protocols
            if (liquidityToRemove > 0) {
                await removeLiquidity({
                    params: {
                        contractAddress: selectedPool,
                        params: {
                            liquidity:
                                ethers.utils.parseEther(liquidityToRemove),
                        },
                    },
                    onError: async (err) => {
                        console.log(err)
                    },
                })
            }
            console.log(`Removing liquidity from ${selectedPool}`)
        } catch (error) {
            console.error("Remove Liquidity failed:", error)
        }
    }

    const handleConfirmCreateLiquidityPool = async (
        token1,
        token1Name,
        token2,
        token2Name
    ) => {
        try {
            console.log(`Create liquidity pool for ${token1Name}/${token2Name}`)
            await createLiquidityPool({
                params: {
                    params: {
                        token1: token1,
                        token2: token2,
                        token1Name: token1Name,
                        token2Name: token2Name,
                    },
                },
                onSuccess: async (tx) =>
                    console.log("Liquidity pool created successfully:", tx),
                onError: async (err) => {
                    console.log(err)
                },
            })
            setIsCreateLPModalOpen(false)
        } catch (error) {
            console.error("Error creating liquidity pool:", error)
        }
    }

    const handleCloseModal = () => {
        setIsCreateLPModalOpen(false)
    }

    return (
        <div className="max-w-lg mx-auto mt-8 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Liquidity Pools</h2>
            {isWeb3Enabled ? (
                <div>
                    <p className="mb-4">Welcome, {account}!</p>
                    <button
                        onClick={() => setIsCreateLPModalOpen(true)}
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mr-2"
                    >
                        Create Liquidity Pool
                    </button>
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
                            Liquidity Amount Token 1:
                        </label>
                        <input
                            type="text"
                            value={liquidityAmountToken1}
                            onChange={(e) =>
                                setLiquidityAmountToken1(e.target.value)
                            }
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Liquidity Amount Token 2:
                        </label>
                        <input
                            type="text"
                            value={liquidityAmountToken2}
                            onChange={(e) =>
                                setLiquidityAmountToken2(e.target.value)
                            }
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <button
                        onClick={handleAddLiquidity}
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mr-2"
                    >
                        Add Liquidity
                    </button>

                    <label className="block text-sm font-medium text-gray-600">
                        Liquidity Amount : {liquidityAmount}
                    </label>
                    {liquidityAmount > 0 ? (
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600">
                                    Liquidity Amount to remove:
                                </label>
                                <input
                                    type="text"
                                    value={liquidityToRemove}
                                    onChange={(e) =>
                                        setLiquidityToRemove(e.target.value)
                                    }
                                    className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                />
                            </div>
                            <button
                                onClick={handleRemoveLiquidity}
                                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                            >
                                Remove Liquidity
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div>Please log in !</div>
            )}

            <CreateLPModal
                isOpen={isCreateLPModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmCreateLiquidityPool}
            />
        </div>
    )
}

export default LiquidityPools
