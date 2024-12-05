"use client"
import ToggleableButton from "@/components/toggleable_button"
import WideButton from "@/components/wide_button"
import Creature from "@/types/creature"
import Region from "@/types/region"
import Species from "@/types/species"
import World from "@/types/world"
import {
    Close,
    LocationDisabled,
    LocationSearching,
    MyLocation,
    NearMe,
    Pets,
    Place,
    Public,
    Tv,
} from "@mui/icons-material"
import { CircularProgress } from "@mui/material"
import { motion } from "framer-motion"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import io, { Socket } from "socket.io-client"

export default function DM() {
    const [admin_password, setAdminPassword] = useState<string>()
    const [_admin_password_entry, setAdminPasswordEntry] = useState<string>("")
    const [socket, setSocket] = useState<Socket>()
    const [socket_connected, setSocketConnected] = useState<boolean>(false)
    const [socket_error, setSocketError] = useState<boolean>(false)
    const [connected_displays, setConnectedDisplays] = useState<number>(0)

    const [win_region, setWinRegion] = useState<boolean>(true)
    const [win_creatures, setWinCreatures] = useState<boolean>(true)

    const [available_worlds, setAvailableWorlds] = useState<World[]>()
    const [selected_world_id, setSelectedWorldId] = useState<string>()
    const [selected_region_id, setSelectedRegionId] = useState<string>()
    const [regions, setRegions] = useState<Region[]>()
    const [creatures, setCreatures] = useState<Creature[]>()
    const [species, setSpecies] = useState<Species[]>()

    const [selected_creature_id, setSelectedCreature] = useState<string>()

    const [map_image_dimensions, setMapImageDimensions] = useState<{ width: number; height: number }>()
    const [canvas_parameters, setCanvasParameters] = useState<{
        x_origin: number
        y_origin: number
        x_scale: number
        y_scale: number
    }>()

    const canvas_ref = useRef<HTMLDivElement>(null)

    const selected_world = selected_world_id ? available_worlds?.find((w) => w.id == selected_world_id) : undefined
    const selected_region = selected_region_id ? regions?.find((r) => r.id == selected_region_id) : undefined
    const present_creatures = creatures?.filter((c) => c.current_region == selected_region_id)

    const region_image = selected_region?.states[selected_region.current_state].image

    const selected_creature = selected_creature_id ? creatures?.find((c) => c.id == selected_creature_id) : undefined
    const selected_creature_region = regions?.find((r) => r.id == selected_creature?.current_region)
    const selected_creature_species = species?.find((s) => s.id == selected_creature?.species)

    const mapCoordsToCanvas = (x: number, y: number) => {
        if (!canvas_parameters || !region_image) {
            return { x: 0, y: 0 }
        }
        const { x_origin, y_origin, x_scale, y_scale } = canvas_parameters

        return {
            x: x_origin + (x - region_image.top_left_corner[0]) * x_scale,
            y: y_origin + (y - region_image.top_left_corner[1]) * y_scale,
        }
    }

    useEffect(() => {
        if (canvas_ref.current && map_image_dimensions && region_image) {
            const image_scale_factor = Math.min(
                canvas_ref.current.clientWidth / map_image_dimensions.width,
                canvas_ref.current.clientHeight / map_image_dimensions.height
            )
            const actual_width = map_image_dimensions.width * image_scale_factor
            const actual_height = map_image_dimensions.height * image_scale_factor
            const actual_origin_x = (canvas_ref.current.clientWidth - actual_width) / 2
            const actual_origin_y = (canvas_ref.current.clientHeight - actual_height) / 2

            const x_scale_factor = actual_width / region_image.width
            const y_scale_factor = actual_height / region_image.height

            console.log("Actual origin", actual_origin_x, actual_origin_y)
            console.log("Scale factors", x_scale_factor, y_scale_factor)

            setCanvasParameters({
                x_origin: actual_origin_x,
                y_origin: actual_origin_y,
                x_scale: x_scale_factor,
                y_scale: y_scale_factor,
            })
        }
    }, [map_image_dimensions, region_image])

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

        new_socket.on("update_species", (new_species: Species[]) => {
            console.log(`Species updated: ${new_species.length}`)
            setSpecies(new_species)
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
                    {available_worlds === undefined ? (
                        <div className="flex items-center gap-2">
                            <p className="text-sm">Loading Worlds</p>
                            <CircularProgress size={20} />
                        </div>
                    ) : available_worlds.length === 0 ? (
                        <p>No worlds available</p>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-rows-[40px_1fr] h-screen w-screen">
                    <header className="bg-gray-200 shadow-lg flex flex-row gap-4 px-20 items-center ">
                        <Public className="text-gray-500" />
                        <ul className="flex flex-row gap-2 justify-center items-center">
                            {available_worlds?.map((w) => (
                                <li key={w.id}>
                                    <ToggleableButton
                                        onClick={() => socket.emit("change_world", w.id)}
                                        selected={w.id == selected_world?.id}
                                    >
                                        {w.name}
                                    </ToggleableButton>
                                </li>
                            ))}
                        </ul>
                    </header>
                    <main className="relative w-full overflow-hidden">
                        <WindowArea className="items-start left-0">
                            <OpenWindow show={!win_region} onClick={() => setWinRegion(true)}>
                                <Place />
                            </OpenWindow>
                            <Window open={win_region} onClose={() => setWinRegion(false)}>
                                <h2 className="font-bold w-full text-center">Regions</h2>
                                <ul className="flex flex-col gap-2">
                                    {regions?.map((region) => (
                                        <li key={region.id} className="flex flex-row justify-between gap-2">
                                            <ToggleableButton
                                                onClick={() => {
                                                    setSelectedRegionId(region.id)
                                                }}
                                                selected={selected_region_id == region.id}
                                            >
                                                {region.name}
                                            </ToggleableButton>
                                            <ToggleableButton
                                                selected={selected_world?.current_region == region.id}
                                                onClick={() => {
                                                    socket.emit("change_region", region.id)
                                                }}
                                                className="!px-2"
                                            >
                                                <NearMe sx={{ fontSize: 16 }} />
                                            </ToggleableButton>
                                        </li>
                                    ))}
                                </ul>
                            </Window>
                            <OpenWindow show={!win_creatures} onClick={() => setWinCreatures(true)}>
                                <Pets />
                            </OpenWindow>
                            <Window open={win_creatures} onClose={() => setWinCreatures(false)}>
                                <h2 className="font-bold w-full text-center">Creatures</h2>
                                <ul className="flex flex-col gap-2">
                                    {creatures?.map((creature) => (
                                        <li key={creature.id} className="flex flex-row justify-between gap-2">
                                            <ToggleableButton
                                                onClick={() => {
                                                    setSelectedCreature(creature.id)
                                                }}
                                                selected={selected_creature_id == creature.id}
                                                className="flex flex-row gap-2 items-center"
                                            >
                                                {creature.name}
                                                {selected_region_id ? (
                                                    creature.current_region == selected_region_id ? (
                                                        <MyLocation sx={{ fontSize: 16 }} />
                                                    ) : (
                                                        <LocationSearching sx={{ fontSize: 16 }} />
                                                    )
                                                ) : (
                                                    <LocationDisabled sx={{ fontSize: 16 }} />
                                                )}
                                            </ToggleableButton>
                                        </li>
                                    ))}
                                </ul>
                            </Window>
                        </WindowArea>

                        <main className="overflow-hidden w-full h-full" ref={canvas_ref}>
                            {region_image && (
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/images/${region_image.path}`}
                                    alt="map"
                                    objectFit="contain"
                                    layout="fill"
                                    unoptimized
                                    onLoadingComplete={(img) => {
                                        setMapImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
                                    }}
                                />
                            )}
                            {canvas_parameters &&
                                present_creatures &&
                                region_image &&
                                present_creatures?.map((creature) => {
                                    const { x, y } = mapCoordsToCanvas(creature.position[0], creature.position[1])
                                    const state = species?.find((s) => s.id == creature.species)?.states[
                                        creature.current_state
                                    ]

                                    const image_path = state ? state.image : "missing.png"
                                    const image_width = state ? state.width : 1
                                    const image_height = state ? state.height : 1

                                    return (
                                        <motion.button
                                            key={creature.id}
                                            style={{
                                                position: "absolute",
                                                top: y,
                                                left: x,
                                                width: image_width * canvas_parameters.x_scale,
                                                height: image_height * canvas_parameters.y_scale,
                                            }}
                                            onDrag={() => {}} // Add drag functionality
                                            onClick={() => {}} // Add click functionality
                                            className=" rounded-lg shadow-[inset_3px_3px_3px_3px_rgba(0,0,0,0.3),inset_-3px_-3px_3px_3px_rgba(255,255,255,0.3),-3px_-3px_3px_3px_rgba(255,255,255,0.1)] backdrop-blur-[1px] backdrop-filter"
                                        >
                                            <Image
                                                layout="fill"
                                                objectFit="contain"
                                                src={`${process.env.NEXT_PUBLIC_API_URL}/images/${image_path}`}
                                                alt="creature"
                                                unoptimized
                                            />
                                        </motion.button>
                                    )
                                })}
                        </main>

                        <WindowArea className="items-end right-0">
                            <Window
                                open={selected_creature_id !== undefined}
                                onClose={() => setSelectedCreature(undefined)}
                                className="text-sm"
                            >
                                <h2 className="font-bold w-full text-center !text-base">{selected_creature?.name}</h2>

                                {selected_creature && (
                                    <div className="w-full h-20 relative">
                                        <Image
                                            src={
                                                `${process.env.NEXT_PUBLIC_API_URL}/images/` +
                                                    selected_creature_species?.states[selected_creature.current_state]
                                                        .image || "missing.png"
                                            }
                                            alt={selected_creature ? selected_creature.name : "creature"}
                                            fill
                                            objectFit="contain"
                                            unoptimized
                                        />
                                    </div>
                                )}
                                <p className="text-center text-gray-500">{selected_creature_species?.name}</p>
                                <ToggleableButton
                                    onClick={() => {
                                        setSelectedRegionId(selected_creature_region?.id)
                                    }}
                                    selected={selected_region_id == selected_creature_region?.id}
                                    className="items-center flex gap-2 mx-auto"
                                >
                                    <Place sx={{ fontSize: 16 }} />
                                    {selected_creature_region?.name}
                                </ToggleableButton>
                                <div className="flex gap-2 items-center">
                                    <p className="font-bold">State:</p>
                                </div>
                            </Window>
                        </WindowArea>
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
            <p className="font-bold">{count}</p>
        </div>
    )
}

function Window({
    children,
    open,
    onClose,
    className,
}: {
    children: React.ReactNode
    open: boolean
    onClose: () => void
    className?: string
}) {
    if (!open) {
        return null
    }
    return (
        <div
            className={`bg-gray-200 shadow-lg flex flex-col gap-2 p-4 rounded-2xl w-full h-full relative ${className}`}
        >
            <Close className="absolute top-3 right-3 cursor-pointer" onClick={onClose} />
            {children}
        </div>
    )
}

function OpenWindow({ show, onClick, children }: { show: boolean; onClick: () => void; children: React.ReactNode }) {
    if (!show) {
        return null
    }
    return (
        <button onClick={onClick} className="p-2 rounded-full bg-white shadow-lg">
            {children}
        </button>
    )
}

function WindowArea({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={`absolute inset-y-0 w-64 z-50 p-4 gap-4 flex flex-col ${className}`}>{children}</div>
}
