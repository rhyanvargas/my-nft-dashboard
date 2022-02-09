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
  document.querySelector("#user-name").innerHTML = `<p>Connected User: ${user.get('ethAddress')}</p>`;
  document.querySelector("#user-name").style.display = "block";
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
async function getNFTs(chain, ownerAddress, contractAddress) {
  const options = { chain, ownerAddress };
  let polygonNFTs = {};

  if (contractAddress) { // If requesting nfts by contract ...
    options.token_address = contractAddress;
    polygonNFTs = await Moralis.Web3API.account.getNFTsForContract(options);
  } else { // Else get all nfts from owner...
    polygonNFTs = await Moralis.Web3API.account.getNFTs(options);
  }

  console.log(JSON.stringify(polygonNFTs));
}

// function minNFT() {}

async function sendNFT() {
  // https://docs.moralis.io/moralis-server/sending-assets#transferring-erc721-tokens-non-fungible
  // sending a token with token id = 1
  const options = {
    type: "erc721",
    receiver: "0xB129304Eb6dF88F3BAedd91Af016540e93850384",
    contractAddress: "0x44A3486708129982EC51f635dD32EB6D0e7CB87E.",
    tokenId: 1
  }
  let transaction = await Moralis.transfer(options)

  // const input = document.querySelector('#input_image');
  // let data = input.files[0]
  // const imageFile = new Moralis.File(data.name, data)
  // await imageFile.saveIPFS();
  // let imageHash = imageFile.hash();

  // let metadata = {
  //   name: document.querySelector('#input_name').value,
  //   description: document.querySelector('#input_description').value,
  //   image: "/ipfs/" + imageHash
  // }
  // console.log(metadata);
  // const jsonFile = new Moralis.File("metadata.json", { base64: btoa(JSON.stringify(metadata)) });
  // await jsonFile.saveIPFS();

  // let metadataHash = jsonFile.hash();
  // console.log(jsonFile.ipfs())
  // let res = await Moralis.Plugins.rarible.lazyMint({
  //   chain: 'rinkeby',
  //   userAddress: user.get('ethAddress'),
  //   tokenType: 'ERC721',
  //   tokenUri: 'ipfs://' + metadataHash,
  //   royaltiesAmount: 5, // 0.05% royalty. Optional
  // })
  // console.log(res);
  // document.querySelector('#success_message').innerHTML =
  //   `NFT minted. <a href="https://rinkeby.rarible.com/token/${res.data.result.tokenAddress}:${res.data.result.tokenId}">View NFT`;
  // document.querySelector('#success_message').style.display = "block";
  // setTimeout(() => {
  //   document.querySelector('#success_message').style.display = "none";
  // }, 5000)
}


document.getElementById("btn_login").onclick = login;
document.getElementById("btn_logout").onclick = logOut;
document.getElementById("btn_send_nft").onclick = sendNFT;
// Slate and tell nfts...
// document.getElementById("btn_fetch_nfts").onclick = getNFTs("mumbai", "0x15a7cd34d6df4b5291b4e2490fdc1c773de679bf", "0x44a3486708129982ec51f635dd32eb6d0e7cb87e");
document.getElementById("btn_fetch_nfts").onclick = getNFTs("eth", "0x5BDFe858fd8e8E7b6104B703Af1B35086e840FCb");

/** Useful Resources  */

// https://docs.moralis.io/moralis-server/users/crypto-login
// https://docs.moralis.io/moralis-server/getting-started/quick-start#user
// https://docs.moralis.io/moralis-server/users/crypto-login#metamask

/** Moralis Forum */

// https://forum.moralis.io/