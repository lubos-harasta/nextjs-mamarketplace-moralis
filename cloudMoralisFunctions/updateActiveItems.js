/**
 * This script serves for uploading cloud functions to Moralis server.
 * As functions are going to be uploaded to the Moralis server, we do not need to
 * import Moralis packages.
 *
 * afterSave => once an event is fired (for instance ItemListed) then the script defined in
 * afterSave() function is run.
 */

const itemListedArray = {
    marketplaceAddress: "address",
    nftAddress: "nftAddress",
    price: "price",
    tokenId: "tokenId",
    seller: "seller",
}

const itemCanceledArray = {
    marketplaceAddress: "address",
    nftAddress: "nftAddress",
    tokenId: "tokenId",
}

const itemBoughtArray = {
    marketplaceAddress: "address",
    // buyer: "buyer", // it is not in ActiveItem
    nftAddress: "nftAddress",
    tokenId: "tokenId",
    price: "price",
}

const nftMintedArray = {
    nftAddress: "address",
    tokenId: "tokenId",
    owner: "to",
}

Moralis.Cloud.afterSave("NftMinted", async (request) => {
    const confirmed = request.object.get("confirmed")
    const logger = Moralis.Cloud.getLogger() // to be able log on Moralis server

    if (confirmed) {
        logger.info("Minted NFT found!")
        await setMoralisObject(request, "NftOwners", nftMintedArray)
    }
})

Moralis.Cloud.afterSave("ItemListed", async (request) => {
    // Every event gets triggered twice (the first time is unconfirmed once the function is called and
    // and when the TX is mined then it is confirmed.
    // .. and we need to have it confirmed.
    const confirmed = request.object.get("confirmed")
    const logger = Moralis.Cloud.getLogger() // to be able log on Moralis server

    if (confirmed) {
        logger.info("Found Item!")
        // check if item already exists and delete it if so
        const itemAlreadyListedArray = Object.assign({}, itemListedArray) // create a new object
        delete itemAlreadyListedArray.price // price has been changed thus it needs to be deleted
        const query = await getItemQuery(request, "ActiveItem", itemAlreadyListedArray)
        logger.info(`query: ${query}`)

        const alreadyListedItem = await query.first()
        logger.info(`already listed item: ${alreadyListedItem}`)

        if (alreadyListedItem) {
            logger.info(`Deleting already listed ${request.object.get("objectId")}`)
            await alreadyListedItem.destroy()
            logger.info(
                `Deleted item with tokenId ${request.object.get(
                    "tokenId"
                )} on address ${request.object.get(
                    "nftAddress"
                )} since it has been already listed.`
            )
        }
        // add the item into the ActiveItem
        await setMoralisObject(request, "ActiveItem", itemListedArray)
    }
})

Moralis.Cloud.afterSave("ItemBought", async (request) => {
    const confirmed = request.object.get("confirmed")
    const logger = Moralis.Cloud.getLogger()
    logger.info(`Marketplace | Object: ${request.object}`)
    if (confirmed) {
        const query = await getItemQuery(request, "ActiveItem", itemBoughtArray)
        logger.info(`Marketplace | Query: ${query}`)

        const boughtItem = await query.first()
        logger.info(`Marketplace | Bought Item: ${boughtItem}`)

        if (boughtItem) {
            const tokenId = request.object.get("tokenId")
            const nftAddress = request.object.get("nftAddress")
            const newOwner = request.object.get("buyer")

            logger.info(
                `Deleting NFT with tokenId ${tokenId} on address ${nftAddress} since it was bought by ${newOwner}.`
            )
            await boughtItem.destroy()

            logger.info("Updating the owner of the bought NFT...")
            // create the new Object and remove the owner
            const nftOldRecordArray = Object.assign({}, nftMintedArray)
            delete nftOldRecordArray.owner
            nftOldRecordArray.nftAddress = "nftAddress"
            // create the query
            const ownerQuery = await getItemQuery(request, "NftOwners", nftOldRecordArray)
            const oldRecordExists = await ownerQuery.first()
            logger.info(`Old Record: ${oldRecordExists}`)

            if (oldRecordExists) {
                logger.info(`Old record exists, thus deleting it...`)
                await oldRecordExists.destroy()
                const nftNewRecordArray = {
                    nftAddress: "nftAddress",
                    tokenId: "tokenId",
                    owner: "buyer",
                }
                logger.info(
                    `Assigning the new owner with address ${newOwner} of NFT #${tokenId} on address ${nftAddress}`
                )
                await setMoralisObject(request, "NftOwners", nftNewRecordArray)
            }
        } else {
            logger.info(
                `No NFT with tokenId ${request.object.get(
                    "tokenId"
                )} on address ${request.object.get("nftAddress")} found.`
            )
        }
    }
})

Moralis.Cloud.afterSave("ItemCanceled", async (request) => {
    const confirmed = request.object.get("confirmed")
    const logger = Moralis.Cloud.getLogger()
    logger.info(`Marketplace | Object: ${request.object}`)
    if (confirmed) {
        const query = await getItemQuery(request, "ActiveItem", itemCanceledArray)
        logger.info(`Marketplace | Query: ${query}`)

        const canceledItem = await query.first()
        logger.info(`Marketplace | Canceled Item: ${canceledItem}`)

        if (canceledItem) {
            logger.info(
                `Deleting NFT with tokenId ${request.object.get(
                    "tokenId"
                )} on address ${request.object.get("nftAddress")} since it was canceled.`
            )
            await canceledItem.destroy()
        } else {
            logger.info(
                `No NFT with tokenId ${request.object.get(
                    "tokenId"
                )} on address ${request.object.get("nftAddress")} found.`
            )
        }
    }
})

async function setMoralisObject(request, moralisObjectName, objectItems) {
    logger.info(`Setting Moralis Object: "${moralisObjectName}"`)
    // if Moralis Object does not already exist create it
    const MoralisObject = Moralis.Object.extend(moralisObjectName)
    // create an instance of Moralis Object
    const moralisObject = new MoralisObject()
    // loop through objectItems and add them into the Moralis Object
    logger.info(`Starting adding items to ${moralisObjectName}`)
    const keys = Object.keys(objectItems)
    for (const key of keys) {
        await moralisObject.set(key, request.object.get(objectItems[key]))
    }
    logger.info(`Saving ${moralisObjectName}`)
    moralisObject.save()
}

async function getItemQuery(request, moralisObjectName, objectItems) {
    const MoralisObject = Moralis.Object.extend(moralisObjectName)
    const query = new Moralis.Query(MoralisObject)
    // loop through objectItems:
    const keys = Object.keys(objectItems)
    for (const key of keys) {
        logger.info(`Key: ${key}`)
        logger.info(`Value: ${objectItems[key]}`)
        logger.info(`Returned: ${request.object.get(objectItems[key])}`)
        await query.equalTo(key, request.object.get(objectItems[key]))
    }
    return query
}
