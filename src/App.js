import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import { Program, Provider, web3} from '@project-serum/anchor';
import idl from './idl.json';
import kp from './keypair.json';
import Modal from 'react-bootstrap/Modal';

const {SystemProgram, Keypair} = web3;
//making the key pair or resuing the one already collected 
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

const opts = { 
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  const [show, setShow] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom){
          console.log('Phantom wallet found!');
          const response = await solana.connect({onlyIfTrusted:true});
          console.log('Connected with public Key:', response.publicKey.toString());

          setWalletAddress(response.publicKey.toString());
        }
      }else{
        alert('Solana object not found! Get a phantom Wallet! ');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const {solana} = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address: ", baseAccount.publicKey.toString())
      await getGifList();

    }catch (error){
      console.log("error creating BaseAccount account: ", error)
    }
  }

  const sendGif = async () => {
    if (inputValue.legnth === 0) {
      console.log('No img link given');
      return;
    } 
    console.log('Gif Link: ', inputValue);
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("Gif sucesfully sent to program", inputValue)
      await getGifList();
    }catch(error){
      console.log("error sending GIF:", error)
    }
  };

  

  const renderModal = () => {
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    return (
      <>
        <button className="cta-button submit-gif-button" onClick={handleShow}>Add New Pool</button>
        <Modal show={show} onHide={handleClose} >
          <Modal.Header closeButton>
            <Modal.Title>Add new Prediction Pool</Modal.Title>
          </Modal.Header>
          <Modal.Body>Whoohoo, this is the modal body, I'll put the form here!</Modal.Body>
          <Modal.Footer>
          <button className="cta-button connect-wallet-button" onClick={handleClose}>
          Close
          </button>
          <button className="cta-button connect-wallet-button" onClick={handleClose}>
          Add Pool 
          </button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  const renderNotConnectedContainer = () => (
    <button 
      className="cta-button connect-wallet-button"
      onClick={connectWallet} >
      Connect to Wallet
    </button>
  );

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log("Got the account", account)
      setGifList(account.poolList)
    }catch(error){
      console.log("Error in getGifs: ", error)
      setGifList(null);
    }
  }

  const renderConnectedContainer = () => {

    if (gifList === null){
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initilisation for GIF PRgram Account 
          </button>
        </div>
      )
    } else {
      return (
        <div className="connected-container">
          <renderModal />
          <input type="text" placeholder="Enter gif link" 
          value={inputValue} onChange={onInputChange}/>
          <button className="cta-button submit-gif-button" onClick={sendGif}>Submit</button>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.imageLink} alt="Pool Image" />
              </div>
            ))}
          </div>
        </div>
        )
    };
  };

  

  useEffect(() => {
    window.addEventListener('load', async(event)=> {
      await checkIfWalletIsConnected();
    });
  },[]);

  useEffect(() => {
    if (walletAddress){
      console.log("Fetching GIF list...");
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? "authed-container":"container"}>
        <div className="header-container">
          <p className="header">Prediction Pools</p>
          <p className="sub-text">
            Can you predict the outcome? If you can you'll make some money ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
