import { Point2D } from "./_basic"

interface Creature {
    name: string
    id: string
    species: string
    current_state: string
    visible: boolean
    current_region: string
    position: Point2D
}

export default Creature
