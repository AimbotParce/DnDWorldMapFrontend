import { Point2D } from "./_basic"
import { Grid, RegionImage } from "./region"

interface VisibleRegion {
    name: string
    grid: null | Grid
    image: RegionImage
    visible_polygon: Point2D[]
}

export default VisibleRegion
