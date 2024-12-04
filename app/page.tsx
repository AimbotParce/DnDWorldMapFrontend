import WideAnchor from "@/components/wide_anchor"

export default function Home() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col gap-2">
                <h1 className="font-bold text-3xl">Welcome to the Dungeon!</h1>
                <hr className="border-t-1 border-gray-800" />
                <h3 className="font-bold">I am a...</h3>
                <WideAnchor href="/player">Player</WideAnchor>
                <WideAnchor href="/dm">Dungeon Master</WideAnchor>
                <WideAnchor href="/display">Display</WideAnchor>
            </div>
        </main>
    )
}
