import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl mb-8">The requested page could not be found.</p>
      <Link href="/" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
        Back to CocktailBot
      </Link>
    </div>
  )
}
