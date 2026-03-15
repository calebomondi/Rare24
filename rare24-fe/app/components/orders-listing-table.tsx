import { OfferListing } from "../types/index.t"
import { Grid2x2X } from "lucide-react"

export default function OrdersListingTable({ data, tab } : { data: OfferListing[], tab: string }) {

  return (
    <div className="overflow-x-auto">
      {
        data.length > 0 ? (
          <table className="w-full text-lg text-gray-700 dark:text-gray-300">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-0 font-medium text-muted-foreground">Price</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">From</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {
                data.map((order, idx) => (
                  <tr key={idx} className="border-b border-gray-500/30">
                    {/* <td className="py-3 px-0 font-semibold">{order.price} ETH</td> */}
                    <td className="py-3 px-0 font-semibold">
                      <div className="flex items-center gap-1">
                        <img 
                          src="/eth_light.png" 
                          alt={order.account}
                          className="w-3 object-cover hidden dark:block"
                        />
                        <img 
                          src="/eth_dark.png" 
                          alt={order.account}
                          className="w-5 object-cover dark:hidden"
                        />
                        <p className="text-lg font-semibold">
                          <span className="font-semibold">
                            {order.price}
                          </span>
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{order.amount}</td>
                    <td className="py-3 px-4 text-muted-foreground">{order.account}</td>
                    <td className="py-3 px-4 text-muted-foreground">{order.expires}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center mt-5">
            <Grid2x2X size={60} className="text-teal-500/80 mb-3"/>
            <span className="text-lg text-teal-600/80">{tab == 'orders' ? "No Offers Made Yet" : "No NFTs Listed Yet!"}</span>
          </div>
        )
      }
    </div>
  )
}
