/** Connect to Moralis server */
const serverUrl = "https://b21nuxnwzwy4.usemoralis.com:2053/server";
const appId = "6ZMbqgNZpA94FiW5EFqBDsoWQ0fCaEtISedrnJnc";
Moralis.start({ serverUrl, appId });
let user = Moralis.User.current();
// DOM Elements
let btnNftIds = document.getElementById("btn_fetch_nft_ids")
let btnNfts = document.getElementById("btn_fetch_nfts")
let btnLogin = document.getElementById("btn_login")
let btnLogout = document.getElementById("btn_logout")
let btnMintNFT = document.getElementById("btn_mint_nft")
let appContainer = document.querySelector("#app");
let userName = document.querySelector("#user-name");
let nameInput = document.querySelector('#input_name');
let descriptionInput = document.querySelector('#input_description');
let imageInput = document.querySelector('#input_image');
let imageElement = document.querySelector('#image-preview');
let toAddressInput = document.querySelector('#input_address');

// AUTHENTICATE - LOGOUT / LOGIN
async function login() {
  if (!user) {
    try {
      user = await Moralis.authenticate({ signingMessage: "Hello World!" })
      const account = await Moralis.account;
      console.log(account); // "0x...."
      await Moralis.enableWeb3();
      initApp();
    } catch (error) {
      console.log(error)
    }
  }
  else {
    Moralis.enableWeb3();
    initApp();
  }
}

async function logOut() {
  await Moralis.User.logOut();
  appContainer.style.display = "none";
  btnLogout.style.display = "none";
  btnLogin.style.display = "block";
  console.log("logged out");
}

// START APP
function initApp() {
  btnLogin.style.display = "none";
  btnLogout.style.display = "block";
  userName.innerHTML = `<span class="text-uppercase">Connected User: </span><span >${user.get('ethAddress')}</span>`;
  userName.style.cssText += 'display:block; ';
  appContainer.style.display = "block";
  // Preview image when uploaded...
  imageInput.onchange = (e) => {
    let [file] = imageInput.files;
    if (file) {
      imageElement.style.display = "block"
      imageElement.src = URL.createObjectURL(file);
    }
  }
}

// NFT FUNCTIONS
async function getNFTidsByContract(contractAddress, chain) {
  const options = { address: contractAddress, chain };
  const tokenIds = [];
  const nftResults = await Moralis.Web3API.token.getAllTokenIds(options);

  // grab token Ids...
  nftResults && nftResults.result.map((nft) => {
    tokenIds.push(
      {
        "token_address": nft.token_address,
        "token_id": nft.token_id,
        "contract_type": nft.contract_type,
        "token_uri": nft.token_uri,
        "metadata": nft.metadata,
        "synced_at": nft.synced_at,
        "amount": nft.amount,
        "name": nft.name,
        "symbol": nft.symbol
      });
  })

  console.log(JSON.stringify(tokenIds));

  return tokenIds;
}

async function getMyNfts(chain, ownerAddress) {
  const options = { chain, address: ownerAddress };
  let polygonNFTs = await Moralis.Web3API.account.getNFTs(options);

  console.log(JSON.stringify(polygonNFTs));
}

// 1. Upload NFT metadata to IPFS
async function getImageIPFS() {
  const data = await imageInput.files[0];
  const imageFile = new Moralis.File(nameInput.value, data);
  await imageFile.saveIPFS();
  console.log('IMAGE UPLOAD: SUCCESS...: ', imageFile.ipfs())
  return imageFile.ipfs();
}

// 2. Upload metadata to IPFS
async function getMetadata(imageURL) {
  const metadata = {
    "name": nameInput.value,
    "imageUrl": imageURL,
    "description": descriptionInput.value,
  }
  const metadataFile = new Moralis.File("NFTmetadata.json", { base64: btoa(JSON.stringify(metadata)) })
  await metadataFile.saveIPFS();
  console.log('METADATA UPLOAD: SUCCESS...', metadataFile.ipfs())
  return metadataFile.ipfs();
}

// 3. Call image and metadata upload functions....
async function getTokenURI() {
  const image = await getImageIPFS();
  const uri = await getMetadata(image);
  console.log("TOKEN URI RECEIVED: ", uri);
  return uri
}


// 4. Mint
async function mintNFT(_to) {
  const contractAddress = '0x44a3486708129982ec51f635dd32eb6d0e7cb87e';
  const ABI = [{ "inputs": [], "name": "lastId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "string", "name": "uri", "type": "string" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];
  const tokenURI = await getTokenURI();
  const sendOptions = {
    contractAddress: contractAddress,
    functionName: "mint",
    abi: ABI,
    params: {
      to: _to,
      uri: tokenURI,
    },
  };

  const transaction = await Moralis.executeFunction(sendOptions);
  console.log('TRANSACTION HASH(PENDING...): ', transaction.hash)
  // --> "0x39af55979f5b690fdce14eb23f91dfb0357cb1a27f387656e197636e597b5b7c"

  // Wait until the transaction is confirmed
  await transaction.wait();
  console.log("TRANSACTION CONFIRMED! NFT SENT TO ADDRESS: ", _to);

  // Read new value
}

// 5. send nft
// async function sendNFT(receiver, contractAddress, tokenId) {
//   // https://docs.moralis.io/moralis-server/sending-assets#transferring-erc721-tokens-non-fungible
//   const options = {
//     type: "erc721",
//     receiver,
//     contractAddress,
//     tokenId
//   }

//   let transaction = await Moralis.transfer(options)
//   const result = await transaction.wait()

//   if (result) console.log(result)
//   return results;
// }


// ADD BUTTON EVENTS
btnLogin.onclick = login;
btnLogout.onclick = logOut;

btnMintNFT.addEventListener('click', function () {
  mintNFT(toAddressInput.value);
})
btnNfts.addEventListener('click', function () {
  getMyNfts("mumbai", "0x15a7cd34d6df4b5291b4e2490fdc1c773de679bf", "0x44a3486708129982ec51f635dd32eb6d0e7cb87e");
  // getNFTs("mumbai", "0x5BDFe858fd8e8E7b6104B703Af1B35086e840FCb");
});
btnNftIds.addEventListener('click', function () {
  getNFTidsByContract("0x44a3486708129982ec51f635dd32eb6d0e7cb87e", "mumbai");
});


// https://docs.moralis.io/moralis-server/users/crypto-login
// https://docs.moralis.io/moralis-server/getting-started/quick-start#user
// https://docs.moralis.io/moralis-server/users/crypto-login#metamask

/** Moralis Forum */

// https://forum.moralis.io/