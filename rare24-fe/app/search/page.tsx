import SearchClient from "./client"

export default async function searchPage() {
    try {
        return <SearchClient />
    } catch (error) {
        console.error('Error fetching usernames:', error)
    }
}

export async function generateMetadata() {
  return {
    title: `Search Profile`,
    description: `Search User's Profile`
  }
}
