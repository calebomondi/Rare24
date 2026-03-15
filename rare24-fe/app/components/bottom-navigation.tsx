"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Plus, Tags, Home, Search, User } from "lucide-react"
import { useFarcasterStore } from "../store/useFarcasterStore"
import { useConnection } from "wagmi"

export default function BottomNavigation() {
  const pathname = usePathname()
  const user = useFarcasterStore((state) => state.user)
  const { address } = useConnection()

  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    {
      href: "/uploadNft",
      icon: Plus,
      label: "Add",
    },
    {
      href: "/marketplace",
      icon: Tags,
      label: "Notifications",
    },
    {
      href: "/",
      icon: Home,
      label: "Home",
    },
    {
      href: "/search",
      icon: Search,
      label: "Search",
    },
    {
      href: mounted ? `/profile/${user ? user.username : 'NaN'}/${address}` : '',
      icon: User,
      label: "Profile",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-20 right-0 border-t-1 dark:border-gray-600 bg-background">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto sm:max-w-none">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center justify-center w-12 h-12 rounded-full transition-colors
                ${isActive ? "bg-[#00B7B5]/50 text-[#005461] dark:text-[#F4F4F4]" : "text-muted-foreground hover:text-foreground"}
              `}
              aria-label={item.label}
            > 
              {
                (item.label === "Profile" && user) ? (
                  <img 
                    src={`${user?.pfpUrl}`} 
                    alt={`${user?.username} Profile Picture`}
                    className="w-10 rounded-full object-contain"
                  />
                ) : (
                  <Icon className="w-7 h-7" />
                )
              }
            </Link>
          )
        })}
      </div>
    </nav>
  )
}