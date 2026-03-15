//

export default function NotFound() {
  return (
    <div 
        className="flex items-center justify-center my-16" 
        style={{ minHeight: 'calc(100vh - 8rem)' }}
    >
      <p className="text-lg text-teal-600/80">The requested NFT does not exist.</p>
    </div>
  )
}