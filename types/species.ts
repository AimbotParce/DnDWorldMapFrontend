interface SpeciesState {
    image: string
    width: number
    height: number
}

interface Species {
    name: string
    id: string
    states: { [key: string]: SpeciesState }
}

export default Species
