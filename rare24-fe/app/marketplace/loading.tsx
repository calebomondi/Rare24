//

export default function Loading() {
  return (
    <div className="flex items-center justify-center my-16" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      <div className="flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <g transform="translate(50,50)">
            <g transform="scale(0.7)">
              <circle fill="#018790" r="50" cy="0" cx="0"></circle>
              <circle fill="#ffffff" r="15" cy="-28" cx="0">
                <animateTransform 
                  values="0 0 0;360 0 0" 
                  keyTimes="0;1" 
                  repeatCount="indefinite" 
                  dur="1s" 
                  type="rotate" 
                  attributeName="transform"
                />
              </circle>
            </g>
          </g>
        </svg>
        <span className="text-lg text-teal-600/80">Fetching Listings</span>
      </div>
    </div>
  )
}