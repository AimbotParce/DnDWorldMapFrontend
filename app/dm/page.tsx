"use client"
import WideButton from "@/components/wide_button"
import { CircularProgress } from "@mui/material"
import { useEffect, useState } from "react"
import io, { Socket } from "socket.io-client"

export default function DM() {
    const [admin_password, setAdminPassword] = useState<string>()
    const [_admin_password_entry, setAdminPasswordEntry] = useState<string>("")
    const [socket, setSocket] = useState<Socket>()
    const [socket_connected, setSocketConnected] = useState<boolean>(false)
    const [socket_error, setSocketError] = useState<boolean>(false)
    const [connected_displays, setConnectedDisplays] = useState<number>(0)

    useEffect(() => {
        if (admin_password === undefined) {
            return
        }

        const new_socket = io(`${process.env.NEXT_PUBLIC_API_URL}/dm`, {
            extraHeaders: {
                Authorization: admin_password,
            },
            // transports: ["websocket"],
        })

        new_socket.on("disconnect", () => {
            console.log("Socket disconnected")
            // Reset the admin password when the connection is lost (or if it was incorrect)
            setAdminPassword(undefined)
            setSocket(undefined)
            setSocketConnected(false)
        })

        new_socket.on("connect_error", () => {
            console.log("Connection error")
            setSocketError(true)
            setAdminPassword(undefined)
            setSocketConnected(false)
        })

        // Connect to the server when the component mounts
        new_socket.on("connected", () => {
            console.log("Socket connected")
            setSocketConnected(true)
        })

        new_socket.on("update_display_count", (count: number) => {
            console.log(`Display count: ${count}`)
            setConnectedDisplays(count)
        })

        setSocket(new_socket)
        // Cleanup the connection when the component unmounts
        return () => {
            new_socket.disconnect()
        }
    }, [admin_password])

    const handleAdminPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        setAdminPasswordEntry(event.target.value)
    }

    const handlePasswordSubmission = () => {
        // Try to connect to the server with the password
        setAdminPassword(_admin_password_entry)
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            {socket_error ? (
                <div className="flex flex-col gap-2 justify-center items-center">
                    <h1 className="font-bold">Failed to connect</h1>
                    <WideButton
                        onClick={() => {
                            setSocket(undefined)
                            setAdminPassword(undefined)
                            setSocketError(false)
                        }}
                    >
                        Try again
                    </WideButton>
                </div>
            ) : admin_password === undefined ? (
                <form className="flex flex-col gap-2" onSubmit={(event) => event.preventDefault()}>
                    <label htmlFor="admin_password" className="font-bold">
                        Admin Password
                    </label>
                    <input
                        className="w-full px-4 py-2 rounded-xl shadow-lg border border-gray-300"
                        id="admin_password"
                        type="password"
                        value={_admin_password_entry}
                        onChange={handleAdminPasswordChange}
                    />
                    <button
                        className="w-full px-4 py-2 rounded-xl shadow-lg border border-gray-300 font-bold"
                        onClick={handlePasswordSubmission}
                        type="submit"
                    >
                        Access
                    </button>
                </form>
            ) : socket === undefined || !socket_connected ? (
                <div className="flex flex-row gap-2 justify-center items-center">
                    <h1 className="font-bold">Connecting</h1>
                    <CircularProgress size={20} />
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <h1 className="font-bold text-3xl">Welcome, Dungeon Master!</h1>
                    <p>There are currently {connected_displays} displays connected.</p>
                </div>
            )}
        </main>
    )
}
