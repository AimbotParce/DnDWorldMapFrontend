"use client"
import VisibleCreature from "@/types/visible_creature"
import VisibleRegion from "@/types/visible_region"
import { CircularProgress } from "@mui/material"
import { motion } from "framer-motion"
import { Uncial_Antiqua } from "next/font/google"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import io, { Socket } from "socket.io-client"

const unical_antiqua_font = Uncial_Antiqua({ weight: "400", subsets: ["latin"] })

export default function Display() {
    const [socket, setSocket] = useState<Socket>()
    const [socket_connected, setSocketConnected] = useState<boolean>(false)

    const [world, setWorld] = useState<string>()
    const [region, setRegion] = useState<VisibleRegion>()
    const [creatures, setCreatures] = useState<VisibleCreature[]>()
    const [transitioning, setTransitioning] = useState<boolean>(false)
    const [transitioning_to, setTransitioningTo] = useState<string>("")
    const [clouds, setClouds] = useState<
        { x: number; y: number; scale: number; kind: number; x_out: number; y_out: number; scale_out: number }[]
    >([])

    const [map_image_dimensions, setMapImageDimensions] = useState<{ width: number; height: number }>()
    const [canvas_parameters, setCanvasParameters] = useState<{
        x_origin: number
        y_origin: number
        x_scale: number
        y_scale: number
    }>()

    const canvas_ref = useRef<HTMLDivElement>(null)

    console.log("Region", region)

    const mapCoordsToCanvas = (x: number, y: number) => {
        if (!canvas_parameters || !region) {
            return { x: 0, y: 0 }
        }
        const { x_origin, y_origin, x_scale, y_scale } = canvas_parameters

        return {
            x: x_origin + (x - region.image.top_left_corner[0]) * x_scale,
            y: y_origin + (y - region.image.top_left_corner[1]) * y_scale,
        }
    }

    useEffect(() => {
        if (canvas_ref.current && map_image_dimensions && region) {
            const image_scale_factor = Math.min(
                canvas_ref.current.clientWidth / map_image_dimensions.width,
                canvas_ref.current.clientHeight / map_image_dimensions.height
            )
            const actual_width = map_image_dimensions.width * image_scale_factor
            const actual_height = map_image_dimensions.height * image_scale_factor
            const actual_origin_x = (canvas_ref.current.clientWidth - actual_width) / 2
            const actual_origin_y = (canvas_ref.current.clientHeight - actual_height) / 2

            const x_scale_factor = actual_width / region.image.width
            const y_scale_factor = actual_height / region.image.height

            console.log("Actual origin", actual_origin_x, actual_origin_y)
            console.log("Scale factors", x_scale_factor, y_scale_factor)

            setCanvasParameters({
                x_origin: actual_origin_x,
                y_origin: actual_origin_y,
                x_scale: x_scale_factor,
                y_scale: y_scale_factor,
            })
        }
    }, [map_image_dimensions, region])

    useEffect(() => {
        const new_socket = io(`${process.env.NEXT_PUBLIC_API_URL}/display`)

        new_socket.on("disconnect", () => {
            console.log("Socket disconnected")
            setSocket(undefined)
            setSocketConnected(false)
            // Reset everything else
            setWorld(undefined)
            setRegion(undefined)
            setCreatures(undefined)
            setTransitioning(false)
            setTransitioningTo("")
            setMapImageDimensions(undefined)
            setCanvasParameters(undefined)
        })

        // Connect to the server when the component mounts
        new_socket.on("connected", () => {
            console.log("Socket connected")
            setSocketConnected(true)
        })

        new_socket.on("change_world", setWorld)
        new_socket.on("change_region", (new_region: VisibleRegion) => {
            console.log("Changing region")
            setTransitioning(true)
            setTransitioningTo(new_region.name)
            setTimeout(() => {
                setRegion(new_region)
            }, 3500)
            setTimeout(() => {
                setTransitioning(false)
            }, 4000)
        })
        new_socket.on("update_creatures", setCreatures)
        new_socket.on("update_region", setRegion)

        setSocket(new_socket)
        // Cleanup the connection when the component unmounts
        return () => {
            new_socket.disconnect()
        }
    }, [])

    useEffect(() => {
        // Generate random clouds
        const new_clouds = []
        for (let i = 0; i < 20; i++) {
            // Origin coordinates
            const x = Math.random()
            const y = Math.random()
            const scale = Math.random() * 0.7 + 0.3
            new_clouds.push({
                kind: Math.floor(Math.random() * 2) + 1,
                scale: scale,
                x: x - 0.5, // The cloud is centered at x=0.5, y=0.5
                y: y - 0.5,
                x_out: Math.sign(x - 0.5) * 1.5 * 1.5 + 0.5,
                y_out: (y - 0.5) * 1.2,
                scale_out: scale * 1.5,
            })
        }
        setClouds(new_clouds)
    }, [])

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-black ">
            {socket === undefined || !socket_connected ? (
                <div className="flex flex-row gap-2 justify-center items-center">
                    <h1 className="font-bold">Connecting</h1>
                    <CircularProgress size={20} />
                </div>
            ) : (
                <div className="h-screen w-screen relative overflow-hidden">
                    <main className="overflow-hidden w-full h-full" ref={canvas_ref}>
                        {region && (
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/images/${region.image.path}`}
                                alt="map"
                                objectFit="contain"
                                layout="fill"
                                unoptimized
                                onLoadingComplete={(img) => {
                                    setMapImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
                                }}
                            />
                        )}
                        {region &&
                            region.fog_of_war.map((subfog, i) => {
                                if (subfog.length === 0) return null
                                return (
                                    <div
                                        key={i}
                                        className="absolute inset-0 cursor-pointer backdrop-blur-[1px] backdrop-filter z-[1]"
                                        style={{
                                            clipPath: `polygon(${subfog
                                                .map((point) => {
                                                    const pt = mapCoordsToCanvas(point[0], point[1])
                                                    return `${pt.x}px ${pt.y}px`
                                                })
                                                .join(", ")})`,
                                            backgroundColor: "rgb(0,0,0)",
                                        }}
                                    ></div>
                                )
                            })}
                        {canvas_parameters &&
                            creatures?.map((creature, i) => {
                                const { x, y } = mapCoordsToCanvas(creature.position[0], creature.position[1])
                                const image_path = creature.image
                                const image_width = creature.width
                                const image_height = creature.height

                                return (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            x: x,
                                            y: y,
                                        }}
                                        transition={{
                                            type: "tween",
                                            duration: 0.2,
                                        }}
                                        style={{
                                            position: "absolute",
                                            width: image_width * canvas_parameters.x_scale,
                                            height: image_height * canvas_parameters.y_scale,
                                        }}
                                    >
                                        <Image
                                            layout="fill"
                                            objectFit="contain"
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/images/${image_path}`}
                                            alt="creature"
                                            className="drop-shadow-[0px_0px_10px_rgba(0,0,0,0.7)]"
                                            unoptimized
                                        />
                                    </motion.div>
                                )
                            })}
                        {clouds.map((cloud, i) => (
                            <Cloud
                                kind={cloud.kind}
                                x={transitioning ? cloud.x : cloud.x_out}
                                y={transitioning ? cloud.y : cloud.y_out}
                                scale={transitioning ? cloud.scale : cloud.scale_out}
                                key={i}
                            />
                        ))}
                        <motion.div
                            className="absolute inset-0 bg-white z-[2]"
                            animate={{
                                opacity: transitioning ? 1 : 0,
                            }}
                            transition={{
                                type: "tween",
                                duration: 1.5,
                                delay: transitioning ? 2 : 0,
                            }}
                        />
                        <motion.div
                            className={`absolute inset-0 flex flex-col items-center justify-center z-20 font-['Oswald'] ${unical_antiqua_font.className}`}
                            animate={{
                                opacity: transitioning ? 1 : 0,
                                x: transitioning ? 0 : -window.innerWidth,
                            }}
                            transition={{
                                type: "tween",
                                ease: "easeInOut",
                                delay: transitioning ? 1 : 0,
                                duration: 2.5,
                            }}
                        >
                            <h1 className="text-6xl font-bold">{world}</h1>
                            <p className="text-xl"> {transitioning_to} </p>
                        </motion.div>
                    </main>
                </div>
            )}
        </main>
    )
}

function Cloud({ kind, x, y, scale }: { kind: number; x: number; y: number; scale: number }) {
    // Get window dimensions
    const [window_dimensions, setWindowDimensions] = useState<{ width: number; height: number }>()

    useEffect(() => {
        const updateWindowDimensions = () => {
            setWindowDimensions({ width: window.innerWidth, height: window.innerHeight })
        }

        window.addEventListener("resize", updateWindowDimensions)
        updateWindowDimensions()

        return () => window.removeEventListener("resize", updateWindowDimensions)
    }, [])

    return (
        <motion.div
            className="z-10"
            animate={{
                x: window_dimensions ? window_dimensions.width * x : -10000,
                y: window_dimensions ? window_dimensions.height * y : -10000,
                scale: scale,
            }}
            transition={{
                type: "tween",
                duration: 3.5,
                ease: "easeInOut",
            }}
            style={{
                position: "absolute",
                scale: scale,
                width: window_dimensions?.width,
                height: window_dimensions?.height,
            }}
        >
            <Image src={`/cloud/${kind}.png`} alt="cloud" objectFit="contain" fill />
        </motion.div>
    )
}
