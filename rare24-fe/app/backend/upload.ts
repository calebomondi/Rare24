"use server"

import { pinata } from "@/utils/config"

export async function uploadImage(formData: FormData) {
  const file = formData.get('image') as File
  const caption = formData.get('caption') as string
  const creator = formData.get('creator') as string
  const momentCount = formData.get('momentCount') as string
  
  try {
    // Pinata Upload
    const { cid } = await pinata.upload.public
      .file(file)
      .name(`${creator}-${momentCount}`)
      .keyvalues({
        type: 'nft-image',
        uploadAt: new Date().toISOString()
      })
    // const imageUrl = await pinata.gateways.public.convert(cid);
    const imageUrl = `https://indigo-dear-cephalopod-185.mypinata.cloud/ipfs/${cid}`

    // construct NFT metadata
    const nftMetadata = {
      name: `${creator}-${momentCount}`,
      description: caption,
      image: imageUrl,
      attributes: [
        { trait_type: "Rarity", value: "Rare" }
      ],
      external_url: ""
    }

    // upload metadata JSON to pinata
    const metadataUpload = await pinata.upload.public
      .json(nftMetadata)
      .name(`${creator}-${momentCount}-metadata`)
      .keyvalues({
        type: 'nft-metadata',
        uploadAt: new Date().toISOString()
      })
    // const metadataUrl = await pinata.gateways.public.convert(metadataUpload.cid);
    const metadataUrl = `https://indigo-dear-cephalopod-185.mypinata.cloud/ipfs/${metadataUpload.cid}`
    
    return { success: true, message: metadataUrl }
  } catch (error) {
    console.log('Error >>> ', error)
    return { success: false, message: "Upload failed" }
  }
}