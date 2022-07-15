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

Moralis.Cloud.afterSave("ItemListed", async (request) => {
    // Every event gets triggered twice (the first time is unconfirmed once the function is called and
    // and when the TX is mined then it is confirmed.
    // .. and we need to have it confirmed.
    const confirmed = request.object.get("confirmed")
    const logger = Moralis.Cloud.getLogger() // to be able log on Moralis server

    logger.info("Looking for confirmed TX...")
    if (confirmed) {
        logger.info("Found Item!")
        setMoralisObject(request, "ActiveItem", itemListedArray)
    }
})

function setMoralisObject(request, moralisObjectName, objectItems) {
    logger.info(`Setting Moralis Object: "${moralisObjectName}"`)
    // if Moralis Object does not already exist create it
    const MoralisObject = Moralis.Object.extend(moralisObjectName)
    // create an instance of Moralis Object
    const moralisObject = new MoralisObject()
    // loop through objectItems and add them into the Moralis Object
    logger.info(`Starting adding items to ${moralisObjectName}`)
    const keys = Object.keys(objectItems)
    keys.forEach((key, index) => {
        moralisObject.set(key, request.object.get(objectItems[key]))
    })
    logger.info(`Saving ${moralisObjectName}`)
    moralisObject.save()
}
