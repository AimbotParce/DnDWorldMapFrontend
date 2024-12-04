"use client"
import SmallButton from "@/components/small_button"
import WideButton from "@/components/wide_button"
import Creature from "@/types/creature"
import Region from "@/types/region"
import World from "@/types/world"
import { Tv } from "@mui/icons-material"
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

    const [available_worlds, setAvailableWorlds] = useState<World[]>()
    const [world, setWorld] = useState<World>()
    const [regions, setRegions] = useState<Region[]>()
    const [creatures, setCreatures] = useState<Creature[]>()

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

        // Connect to the server when the component mounts
        new_socket.on("connected", () => {
            console.log("Socket connected")
            setSocketConnected(true)
        })

        new_socket.on("update_display_counter", (count: number) => {
            console.log(`Display count: ${count}`)
            setConnectedDisplays(count)
        })

        new_socket.on("change_world", (new_world: World) => {
            console.log(`World changed: ${new_world.name}`)
            setWorld(new_world)
        })

        new_socket.on("update_worlds", (new_worlds: World[]) => {
            console.log(`Worlds updated: ${new_worlds.length}`)
            setAvailableWorlds(new_worlds)
        })

        new_socket.on("update_regions", (new_regions: Region[]) => {
            console.log(`Regions updated: ${new_regions.length}`)
            setRegions(new_regions)
        })

        new_socket.on("update_creatures", (new_creatures: Creature[]) => {
            console.log(`Creatures updated: ${new_creatures.length}`)
            setCreatures(new_creatures)
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
                        className=" w-full px-4 py-2 rounded-full shadow-lg bg-white font-bold"
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
            ) : world === undefined ? (
                <div className="flex flex-col gap-2">
                    <h1 className="font-bold text-3xl">Welcome, Dungeon Master!</h1>
                    <hr className="border-t-1 border-gray-800" />
                    <p className="font-bold">Select a world to navigate to:</p>
                    <ul>
                        {available_worlds?.map((world) => (
                            <li key={world.id}>
                                <WideButton onClick={() => socket.emit("change_world", world.id)}>
                                    {world.name}
                                </WideButton>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="grid grid-rows-[40px_1fr] h-screen w-screen">
                    <header className="bg-gray-200 shadow-lg flex flex-row px-20 items-center">
                        <ul className="flex flex-row gap-2 justify-center items-center">
                            {available_worlds?.map((w) => (
                                <li key={w.id}>
                                    <SmallButton
                                        onClick={() => socket.emit("change_world", w.id)}
                                        className={w.id == world.id ? "bg-blue-500" : ""}
                                    >
                                        {w.name}
                                    </SmallButton>
                                </li>
                            ))}
                        </ul>
                    </header>
                    <main></main>
                    <ConnectedDisplays count={connected_displays} />
                </div>
            )}
        </main>
    )
}

function ConnectedDisplays({ count }: { count: number }) {
    return (
        <div className="flex flex-row gap-1 items-center justify-center rounded-full bg-white absolute bottom-5 right-5 p-4 shadow-lg">
            <Tv />
            <p>{count}</p>
        </div>
    )
}
