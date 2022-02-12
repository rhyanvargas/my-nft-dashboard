/** Connect to Moralis server */
const serverUrl = "https://b21nuxnwzwy4.usemoralis.com:2053/server";
const appId = "6ZMbqgNZpA94FiW5EFqBDsoWQ0fCaEtISedrnJnc";
Moralis.start({ serverUrl, appId });
let user = Moralis.User.current();


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
  document.querySelector("#app").style.display = "none";
  document.querySelector("#btn_logout").style.display = "none";
  document.querySelector("#btn_login").style.display = "block";
  console.log("logged out");
}

// START APP
function initApp() {
  document.querySelector("#user-name").innerHTML = `<span class="text-uppercase">Connected User: </span><span >${user.get('ethAddress')}</span>`;
  document.querySelector("#user-name").style.cssText += 'display:block; ';
  document.querySelector("#app").style.display = "block";
  document.querySelector("#btn_logout").style.display = "block";
  document.querySelector("#btn_login").style.display = "none";
  // HANDLE IMAGE UPLOAD
  const imageInput = document.querySelector('#input_image');
  const imageElement = document.querySelector('#image-preview');
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
async function upload() {

}

// 2. Mint
async function minNFT() {
  // TODO: https://youtu.be/WdQHnb_5m5Q?t=687
}

async function sendNFT(receiver, contractAddress, tokenId) {
  // https://docs.moralis.io/moralis-server/sending-assets#transferring-erc721-tokens-non-fungible
  const options = {
    type: "erc721",
    receiver,
    contractAddress,
    tokenId
  }

  let transaction = await Moralis.transfer(options)
  const result = await transaction.wait()

  if (result) console.log(result)

  return results;
}




// ADD BUTTON EVENTS
let btnNftIds = document.getElementById("btn_fetch_nft_ids")
let btnNfts = document.getElementById("btn_fetch_nfts")
let btnLogin = document.getElementById("btn_login")
let btnLogout = document.getElementById("btn_logout")
let btnSendNft = document.getElementById("btn_send_nft")
btnLogin.onclick = login;
btnLogout.onclick = logOut;
btnSendNft.onclick = sendNFT;

btnNfts.addEventListener('click', function () {
  // ( chain, ownerAddress, contractAddress? )
  getMyNfts("mumbai", "0x15a7cd34d6df4b5291b4e2490fdc1c773de679bf", "0x44a3486708129982ec51f635dd32eb6d0e7cb87e");
  // getNFTs("mumbai", "0x5BDFe858fd8e8E7b6104B703Af1B35086e840FCb");
});
btnNftIds.addEventListener('click', function () {
  // ( contractAddress, chain? )
  getNFTidsByContract("0x44a3486708129982ec51f635dd32eb6d0e7cb87e", "mumbai");

});


// https://docs.moralis.io/moralis-server/users/crypto-login
// https://docs.moralis.io/moralis-server/getting-started/quick-start#user
// https://docs.moralis.io/moralis-server/users/crypto-login#metamask

/** Moralis Forum */

// https://forum.moralis.io/