import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import { Program, Provider, web3} from '@project-serum/anchor';
import idl from './idl.json';
import kp from './keypair.json';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Badge from 'react-bootstrap/Badge';
import Nav from 'react-bootstrap/Nav';
import { Formik } from 'formik';


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
  //const [walletBalance, setWalletBalance] = useState(0);
  const [gifList, setGifList] = useState([]);
  const [show, setShow] = useState(false);
  const [closeDate, setCloseDate] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [poolQuestion, setPoolQuestion] = useState('');
  const [pooldesc, setPoolDesc] = useState('');
  const [winOptions, setWinOptions] = useState("");
  const [verifySite, setVerifySite] = useState("");
  const [ownerFee, setOwnerFee] = useState("");
  const [detailView, setDetailView] = useState(null);

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

  const onPoolQuestionChange = (event) => {
    const {value} = event.target;
    setPoolQuestion(value);
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

      await program.rpc.addGif(inputValue, poolQuestion,pooldesc, winOptions, 568, verifySite, ownerFee,{
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("Gif sucesfully sent to program", inputValue)
      await getGifList();
      setShow(false);
      setInputValue("");
    }catch(error){
      console.log("error sending GIF:", error)
    }
  };

  
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  // const schema = yup.object().shape({
  //   poolQuestion: yup.string().required(),

  // })
  // TODO: add validation to the form checking we have all the requied inforamtion 
  const renderModal = () => {  
    return (
      <>
        <button className="cta-button submit-gif-button" onClick={handleShow}>Add New Pool</button>
        <Modal show={show} onHide={handleClose} >
          <Modal.Header>
            <Modal.Title>Add new Prediction Pool</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row className="mb-3">
                <Form.Group as={Col} controlId="formPoolQuestion">
                  <Form.Label>Pool Question?</Form.Label>
                  <Form.Control type="text" placeholder="What are we prediting?" value={poolQuestion} onChange={onPoolQuestionChange} name="poolQuestion"/>
                  <Form.Text className="text-muted">What are you creating a pool to predit? eg. Who will win the premier league 2021/22?</Form.Text>
                </Form.Group>
                <Form.Group as={Col}>
                  <Form.Label>Close Date and Time</Form.Label>
                  <Form.Control as={DatePicker} selected={closeDate} showTimeSelect onChange={(date) => setCloseDate(date)} />
                  <Form.Text>The date and time after which no more predictions can be placed.</Form.Text>
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group as={Col}>
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" type="text" value={pooldesc} onChange={(event) => setPoolDesc(event.target.value)}/>
                </Form.Group>
                <Form.Group as={Col}>
                  <Form.Label>Win Options</Form.Label>
                  <Form.Control type="text" value={winOptions} onChange={(event)=> setWinOptions(event.target.value)}/>
                  <Form.Text className="text-muted">Enter the list of possible outcomes seperated with ';'</Form.Text>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col}>
                  <Form.Label>Indepedent result website.</Form.Label>
                  <Form.Control type="text" value={verifySite} onChange={(event)=>setVerifySite(event.target.value)}/>
                  <Form.Text className="text-muted">A website which users can visit to verify the result.</Form.Text>
                </Form.Group >
                <Form.Group as={Col} controlId="formImgUrl">
                  <Form.Label>Image Url</Form.Label>
                  <Form.Control type="text" placeholder="Enter gif link" value={inputValue} onChange={onInputChange}/>
                </Form.Group>
              </Row>
              <Form.Group>
                <Form.Label>Owner Fee:</Form.Label>
                <Form.Select onSelect={(event) => setOwnerFee(event.target)}>
                  <option>Select an option</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </Form.Select>
                <Form.Text>The fee you will earn from this pool as a %, max value is 10%</Form.Text>
              </Form.Group>
            </Form>
            
          </Modal.Body>
          <Modal.Footer>
          <button className="cta-button connect-wallet-button" onClick={handleClose}> Close </button>
          <button className="cta-button connect-wallet-button" onClick={sendGif}>Add Pool </button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
  const topNavbar = () =>{
    return (
      <Navbar bg="dark" variant="dark" >
          <Container fluid>
            <Navbar.Brand href="#home">
              <img src="https://images.unsplash.com/photo-1546188994-07c34f6e5e1b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=871&q=80"
               width="30" height="30" className="d-inline-block align-top"/>{" "}
              Sol Prediction Pools 
            </Navbar.Brand>
            {renderModal()}
            <Nav className="justify-content-end">
              <Badge bg="info">Bal: tba</Badge>
            </Nav>
          </Container>
        </Navbar>
    )
  }
  const renderNotConnectedContainer = () => (
    <div className="header-container">
          
        <p className="header">Prediction Pools</p>
        <p className="sub-text">
          Can you predict the outcome? If you can you'll make some money ✨
        </p>
        <button 
          className="cta-button connect-wallet-button"
          onClick={connectWallet} >
          Connect to Wallet
        </button>
      </div>
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
        <div className="header-container">
          {topNavbar()}
          
          <p className="header">Prediction Pools</p>
          <p className="sub-text">
            Can you predict the outcome? If you can you'll make some money ✨
          </p>
        <div className="connected-container">
          <button onClick={setDetailView(true)}></button>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <h3 className="footer-text">{item.poolName}</h3>
                <img src={item.imageLink} alt="Pool Image" />
              </div>
            ))}
          </div>
        </div>
        </div>
        )
    };
  };

  const renderDetialView = () =>{
    return (
      <>
      <div className="header-container">
          {topNavbar()}
        </div>
      <div className="connected-container">
        <h1>Detials View</h1>
      </div>
      </>
    )
  }

  
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
        {/* <div className="header-container">
          
          <p className="header">Prediction Pools</p>
          <p className="sub-text">
            Can you predict the outcome? If you can you'll make some money ✨
          </p> */}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
          {/* {detailView && renderDetialView()} */}
        {/* </div> */}
        {/* <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div> */}
      </div>
    </div>
  );
};

export default App;
