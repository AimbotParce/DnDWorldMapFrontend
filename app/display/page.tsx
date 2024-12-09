"use client"
import VisibleCreature from "@/types/visible_creature"
import VisibleRegion from "@/types/visible_region"
import { CircularProgress } from "@mui/material"
import { motion } from "framer-motion"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import io, { Socket } from "socket.io-client"

export default function Display() {
    const [socket, setSocket] = useState<Socket>()
    const [socket_connected, setSocketConnected] = useState<boolean>(false)

    const [world, setWorld] = useState<string>()
    const [region, setRegion] = useState<VisibleRegion>()
    const [creatures, setCreatures] = useState<VisibleCreature[]>()

    const [map_image_dimensions, setMapImageDimensions] = useState<{ width: number; height: number }>()
    const [canvas_parameters, setCanvasParameters] = useState<{
        x_origin: number
        y_origin: number
        x_scale: number
        y_scale: number
    }>()

    const canvas_ref = useRef<HTMLDivElement>(null)

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
            // Reset the admin password when the connection is lost (or if it was incorrect)
            setSocket(undefined)
            setSocketConnected(false)
            setWorld(undefined)
            setRegion(undefined)
            setCreatures(undefined)
        })

        // Connect to the server when the component mounts
        new_socket.on("connected", () => {
            console.log("Socket connected")
            setSocketConnected(true)
        })

        new_socket.on("change_world", setWorld)
        new_socket.on("change_region", setRegion)
        new_socket.on("update_creatures", setCreatures)

        setSocket(new_socket)
        // Cleanup the connection when the component unmounts
        return () => {
            new_socket.disconnect()
        }
    }, [])

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 ">
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
                                        className="rounded-lg border shadow-[inset_0px_0px_3px_3px_rgba(0,255,255,0.3),0px_0px_3px_3px_rgba(0,255,255,0.3)] backdrop-blur-[1px] backdrop-filter"
                                    >
                                        <Image
                                            layout="fill"
                                            objectFit="contain"
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/images/${image_path}`}
                                            alt="creature"
                                            unoptimized
                                        />
                                    </motion.div>
                                )
                            })}
                    </main>
                </div>
            )}
        </main>
    )
}
