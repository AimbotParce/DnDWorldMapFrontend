import { Point2D } from "./_basic"
import { Grid, RegionImage } from "./region"

interface VisibleRegion {
    name: string
    grid: null | Grid
    image: RegionImage
    fog_of_war: Point2D[][]
}

export default VisibleRegion
