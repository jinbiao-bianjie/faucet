
let cosmoskey = {
},irisKey = {};
const keyDAO = {
	write(name,addressObj){
		if(name === 'cosmosKey'){
			cosmoskey.privateKey = addressObj.privateKey;
			cosmoskey.publicKey = addressObj.publicKey
			cosmoskey.address = addressObj.address
		}
		if(name === 'irisKey'){
			{
				irisKey.privateKey = addressObj.privateKey;
				irisKey.publicKey = addressObj.publicKey
				irisKey.address = addressObj.address
			}
		}
	
	},
	
	read(name){
		if(name === cosmoskey.address){
			return {
				privateKey: cosmoskey.privateKey,
				publicKey: cosmoskey.publicKey,
				address: cosmoskey.address
			}
		}
		if(name === irisKey.address){
			return {
				privateKey: irisKey.privateKey,
				publicKey: irisKey.publicKey,
				address: irisKey.address
			}
		}
	}
}

module.exports = {
	keyDAO
}
