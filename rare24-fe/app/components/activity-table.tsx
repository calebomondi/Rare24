export default function OrdersListingTable() {
  const orders = [
    { type: "Offer", price: "0.41 ETH", from: "user456", to: "user456", qty: 1},
    { type: "Listing", price: "0.62 ETH", from: "user198", to: "user456", qty: 1},
    { type: "Offer", price: "0.75 ETH", from: "user006", to: "user456", qty: 1},
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-lg text-gray-700 dark:text-gray-300">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-0 font-medium text-muted-foreground">Event</th>
            <th className="text-left py-2 px-0 font-medium text-muted-foreground">Price</th>
            <th className="text-left py-2 px-4 font-medium text-muted-foreground">Qty</th>
            <th className="text-left py-2 px-4 font-medium text-muted-foreground">From</th>
            <th className="text-left py-2 px-4 font-medium text-muted-foreground">To</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, idx) => (
            <tr key={idx} className="border-b border-gray-500/30">
              <td className="py-3 px-0 font-semibold">{order.type}</td> 
              <td className="py-3 px-0 font-semibold">{order.price}</td>
              <td className="py-3 px-4">{order.qty}</td>
              <td className="py-3 px-4 text-muted-foreground">{order.from}</td>
              <td className="py-3 px-4 text-muted-foreground">{order.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
