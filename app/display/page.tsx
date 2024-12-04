"use client"
import { CircularProgress } from "@mui/material"
import { useEffect, useState } from "react"
import io from "socket.io-client"

export default function Display() {
    const [socket_connected, setSocketConnected] = useState<boolean>(false)

    useEffect(() => {
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/display`)
        socket.on("disconnect", () => {
            setSocketConnected(false)
        })

        socket.on("connect_error", () => {
            setSocketConnected(false)
        })

        // Connect to the server when the component mounts
        socket.on("connected", () => {
            setSocketConnected(true)
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            {!socket_connected ? (
                <div className="flex flex-row gap-2 justify-center items-center">
                    <h1 className="font-bold">Connecting</h1>
                    <CircularProgress size={20} />
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <h1 className="font-bold text-3xl">Welcome to the Map Display!</h1>
                </div>
            )}
        </main>
    )
}
