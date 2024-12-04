"use client"
import WideButton from "@/components/wide_button"
import Creature from "@/types/creature"
import Region from "@/types/region"
import World from "@/types/world"
import { NearMe, Public, Tv } from "@mui/icons-material"
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
    const [selected_world_id, setSelectedWorldId] = useState<string>()
    const [regions, setRegions] = useState<Region[]>()
    const [creatures, setCreatures] = useState<Creature[]>()

    const selected_world = selected_world_id ? available_worlds?.find((w) => w.id == selected_world_id) : undefined

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

        new_socket.on("change_world", (new_world: string) => {
            console.log(`World changed: ${new_world}`)
            setSelectedWorldId(new_world)
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
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 ">
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
            ) : selected_world_id === undefined ? (
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
                    <header className="bg-gray-200 shadow-lg flex flex-row gap-4 px-20 items-center ">
                        <Public className="text-gray-500" />
                        <ul className="flex flex-row gap-2 justify-center items-center">
                            {available_worlds?.map((w) => (
                                <li key={w.id}>
                                    <WorldButton
                                        onClick={() => socket.emit("change_world", w.id)}
                                        selected={w.id == selected_world.id}
                                        world={w}
                                    />
                                </li>
                            ))}
                        </ul>
                    </header>
                    <main className="relative w-full">
                        <nav className="absolute top-0 left-0 bg-gray-200 shadow-lg flex flex-col gap-2 p-4 m-4 rounded-2xl inset-y-0">
                            <h2 className="font-bold w-full text-center">Regions</h2>
                            <ul className="flex flex-col gap-2">
                                {regions?.map((region) => (
                                    <li key={region.id} className="flex flex-row justify-between gap-1">
                                        <WideButton className="text-start text-sm">{region.name}</WideButton>
                                        <GoToButton
                                            selected={selected_world?.current_region == region.id}
                                            onClick={() => {
                                                socket.emit("change_region", region.id)
                                            }}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </main>
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

function GoToButton({ onClick, selected }: { onClick?: () => void; selected?: boolean }) {
    const baseClassName = "border px-2 py-1 rounded-full shadow-lg font-bold hover:shadow-md "
    return (
        <button
            onClick={selected ? () => {} : onClick}
            className={
                selected
                    ? `${baseClassName} bg-blue-500 border-blue-500 text-white hover:text-white cursor-default`
                    : `${baseClassName} bg-white border-white hover:border-blue-500 hover:text-blue cursor:pointer`
            }
        >
            <NearMe />
        </button>
    )
}

function WorldButton({ world, onClick, selected }: { world: World; onClick: () => void; selected: boolean }) {
    const baseClassName = "border px-4 py-1 rounded-full shadow-lg font-bold text-sm hover:shadow-md "
    return (
        <button
            onClick={onClick}
            className={
                selected
                    ? `${baseClassName} bg-blue-500 border-blue-500 text-white hover:text-white cursor-default`
                    : `${baseClassName} bg-white border-white hover:border-blue-500 hover:text-blue cursor:pointer`
            }
        >
            {world.name}
        </button>
    )
}
