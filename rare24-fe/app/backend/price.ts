"use server"

export async function getEthPrice() {
    // CoinGecko
    const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        {
            next: { revalidate: 600 } // Cache for 10 minutes
        }
    );
    const data = await response.json();
    return data.ethereum.usd;

    // Binance
    // const response = await fetch(
    //     'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT'
    // );
    // const data = await response.json();
    // return parseFloat(data.price);
}