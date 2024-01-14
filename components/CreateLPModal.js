import React, { useState } from "react"

const CreateLPModal = ({ isOpen, onClose, onConfirm }) => {
    const [token1, setToken1] = useState("")
    const [token2, setToken2] = useState("")
    const [token1Name, setToken1Name] = useState("")
    const [token2Name, setToken2Name] = useState("")
    return (
        <div className={`fixed inset-0 ${isOpen ? "visible" : "invisible"}`}>
            <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-6 rounded-md shadow-md">
                    <h2 className="text-xl font-semibold mb-4">
                        Create Liquidity Pool
                    </h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 1:
                        </label>
                        <input
                            type="text"
                            value={token1}
                            onChange={(e) => setToken1(e.target.value)}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 1 Name:
                        </label>
                        <input
                            type="text"
                            value={token1Name}
                            onChange={(e) => setToken1Name(e.target.value)}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 2:
                        </label>
                        <input
                            type="text"
                            value={token2}
                            onChange={(e) => setToken2(e.target.value)}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600">
                            Token 2 Name:
                        </label>
                        <input
                            type="text"
                            value={token2Name}
                            onChange={(e) => setToken2Name(e.target.value)}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                        />
                    </div>
                    <button
                        onClick={() => {
                            onConfirm(token1, token1Name, token2, token2Name)
                        }}
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mr-2"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateLPModal
