import { Point2D } from "./_basic"

interface Grid {
    type: string
    size: number
}

interface RegionImage {
    path: string
    top_left_corner: Point2D
    width: number
    height: number
}

interface RegionState {
    image: RegionImage
}
interface Subregion {
    region: string
    polygon: Point2D[]
    visible: boolean
}
interface Region {
    name: string
    id: string
    grid: null | Grid
    states: { [key: string]: RegionState }
    current_state: string
    visible: boolean
    subregions: Subregion[]
}

export default Region
