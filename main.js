import { APP_ID, SERVER_URL, CONTRACT_ADDRESS, CHAIN } from './secret.js';

/** Connect to Moralis server */
const serverUrl = SERVER_URL;
const appId = APP_ID;
Moralis.start({ serverUrl, appId });
const ethers = await Moralis.web3Library;
let user = Moralis.User.current();
let account = '';

// DOM Elements
let btnNftIds = document.getElementById("btn_fetch_nft_ids")
let btnNfts = document.getElementById("btn_fetch_nfts")
let btnLogin = document.getElementById("btn_login")
let loginContainer = document.getElementById("login_container")
let btnLogout = document.getElementById("btn_logout")
let btnMintNFT = document.getElementById("btn_mint_nft")
let appContainer = document.querySelector("#app");
let userAddressContainer = document.querySelector("#user_address_container");
let userAddress = document.querySelector("#user_address");
let nameInput = document.querySelector('#input_name');
let descriptionInput = document.querySelector('#input_description');
let imageInput = document.querySelector('#input_image');
let imageElement = document.querySelector('#image-preview');
let toAddressInput = document.querySelector('#input_address');
let statusText = document.querySelector('#success_message');

// UTILITY FUNCTIONS - LOGOUT / LOGIN - Validations - Clear Form
async function login() {
  if (!user) {
    try {
      user = await Moralis.authenticate({ signingMessage: "You agree to login to MY NFT DASHBOARD" })
      console.log(`${JSON.stringify(user)}`);
      account = await user.get("ethAddress"); // "0x...."
      await Moralis.enableWeb3();
      initApp();
    } catch (error) {
      alert(`error.message.Alos, make sure you are signed in to metamask`)
      console.log(error)
    }
  }
  else {
    console.log(`${JSON.stringify(user)}`);
    account = await user.get("ethAddress"); // "0x...."
    Moralis.enableWeb3();
    initApp();
  }
}

async function logOut() {
  await Moralis.User.logOut()
    .then(() => {
      user = Moralis.User.current();  // this will now be null
    });
  appContainer.style.display = "none";
  btnLogout.style.display = "none";
  userAddressContainer.style.display = "none";
  loginContainer.style.display = "block";
  console.log("logged out");
  location.reload();
}

// Validations
function isValidAddress(_toAddress) {
  let formattedAddy = _toAddress.toLowerCase();
  console.log(`${ethers.utils.isAddress(formattedAddy)}, ${formattedAddy}`);

  return ethers.utils.isAddress(formattedAddy);
}

function clearForm() {
  toAddressInput.value = null
  nameInput.value = null;
  descriptionInput.value = null;
  imageInput.value = null;
  imageElement.style.display = "none"
}

// START APP
function initApp() {
  loginContainer.style.display = "none";
  btnLogout.style.display = "block";
  userAddressContainer.style.cssText += 'display:block; ';
  userAddress.innerHTML = `<span> ${user.get('ethAddress')}</span > `;
  appContainer.style.display = "block";
  // Preview image when uploaded...

  imageInput.onchange = (e) => {
    let [file] = imageInput.files;
    if (file) {
      // Check file size is less than 4mb 
      const fileSize = Math.round((file.size / 1024));
      if (fileSize >= 4096) {
        alert(
          "File too Big, please select a file less than 4mb");
        imageInput.value = null
        imageElement.style.display = "none"
      } else {
        imageElement.style.display = "block"
        imageElement.src = URL.createObjectURL(file);
      }
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
  let myNfts = await Moralis.Web3API.account.getNFTs(options);
  if (myNfts) {
    console.log(JSON.stringify(myNfts));
    return myNfts;
  }
}

// 1. Upload NFT metadata to IPFS
async function getImageIPFS() {
  const data = await imageInput.files[0];
  if (data) {
    // Format file name...
    let filename = data.name;
    let formattedFilename = filename.replace(/([^a-z0-9]+)/gi, '-');
    console.log(`${formattedFilename} vs.${filename}`);
    const imageFile = new Moralis.File(formattedFilename, data);
    // Before Save completes
    btnMintNFT.innerText = `1 / 3 IMAGE UPLOADING...: ${filename}`;
    await imageFile.saveIPFS();
    statusText.innerText = `SUCCESS! IMAGE UPLOADED: ${imageFile.ipfs()}`;
    return imageFile.ipfs();
  } else {
    return null
  }
}

// 2. Upload metadata to IPFS
async function getMetadata(imageURL) {
  if (imageURL) {
    const metadata = {
      "name": nameInput.value,
      "image": imageURL,
      "description": descriptionInput.value,
    }
    const metadataFile = new Moralis.File("NFTmetadata.json", { base64: btoa(JSON.stringify(metadata)) })
    // Before metadata uploads...
    btnMintNFT.innerText = '2/3 METADATA UPLOADING...';
    await metadataFile.saveIPFS();
    btnMintNFT.innerText = `SUCCESS! METADATA UPLOADED: ${metadataFile.ipfs()}`;
    return metadataFile.ipfs();
  } else {
    return null
  }
}

// 3. Call image and metadata upload functions....
async function getTokenURI() {
  const image = await getImageIPFS();
  if (image !== null) {
    // Before token uri...
    const uri = await getMetadata(image);
    btnMintNFT.innerText = `2 / 3 GETTING IMAGE URL...`;
    console.log(uri);
    btnMintNFT.innerText = `SUCCESS! TOKEN URI: ${uri}`;
    return uri
  } else {
    return null
  }
}

// 4. Mint
async function mintNFT(_to) {
  const isAddressValid = await isValidAddress(_to);
  console.log(`${imageInput.value} + ${isAddressValid}`);
  if (isAddressValid &&
    imageInput.value &&
    nameInput.value &&
    descriptionInput.value
  ) {
    // Disable button 
    btnMintNFT.disabled = true;
    const tokenURI = await getTokenURI();
    const contractAddress = CONTRACT_ADDRESS;
    const ABI = [{ "inputs": [], "name": "lastId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "string", "name": "uri", "type": "string" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];
    const sendOptions = {
      contractAddress: contractAddress,
      functionName: "mint",
      abi: ABI,
      params: {
        to: _to,
        uri: tokenURI,
      },
    };
    btnMintNFT.innerText = `...EXECUTING TRANSACTION...`;
    const transaction = await Moralis.executeFunction(sendOptions);
    // Wait until the transaction is confirmed
    const result = await transaction.wait();
    console.log('transaction finished: ', result);
    statusText.style.display = 'block'
    statusText.innerText = `3/3 TRANSACTION CONFIRMED! NFT SENT TO ADDRESS: ${_to}`;
    clearForm();
    btnMintNFT.disabled = false;
    btnMintNFT.innerText = 'Mint & send nft'
    setTimeout(() => {
      statusText.style.display = 'none'
    }, 5000);
  } else {
    alert('Please check that all fields are correct and try to mint again.');
    toAddressInput.value = null
    imageInput.value = null
    imageElement.style.display = "none"
  }

}

// ADD BUTTON EVENTS
btnLogin.onclick = login;
btnLogout.onclick = logOut;
btnMintNFT.addEventListener('click', function () {
  mintNFT(toAddressInput.value);
})
// btnNfts.addEventListener('click', function () {
//   getMyNfts(CHAIN, user.get('ethAddress'), CONTRACT_ADDRESS);
// });
// btnNftIds.addEventListener('click', function () {
//   getNFTidsByContract(CONTRACT_ADDRESS, CHAIN);
// });