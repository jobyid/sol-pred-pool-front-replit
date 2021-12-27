import { useEffect, useState } from 'react';

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
import Card from 'react-bootstrap/Card';
import Image from 'react-bootstrap/Image';
import Button from 'react-bootstrap/Button';
import { CardGroup } from 'react-bootstrap';
import catergories from "./catergories.json"
//import { Formik } from 'formik';


const {SystemProgram, Keypair, LAMPORTS_PER_SOL} = web3;
//making the key pair or resuing the one already collected 
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
console.log(secret)
let baseAccount = web3.Keypair.fromSecretKey(secret)
console.log(baseAccount.publicKey.toString())

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

const opts = { 
  preflightCommitment: "processed"
}



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
  const [ownerFee, setOwnerFee] = useState(0);
  const [detailView, setDetailView] = useState(false);
  const [fullscreen, setFullscreen] = useState(true);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [stake, setStake] = useState(0);
  const [result, setResult] = useState("");
  const [catergory, setCatergory] = useState("None");
  const [subCatergory, setSubCatergory] = useState("None");
  const [ownerWallet,setOwnerWallet] = useState("");
  

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
    console.log("got provider")
    return provider;
  }

  const createGifAccount = async () => {
    const fs = require('fs')
    console.log("Create Gif Account")
    //baseAccount = web3.Keypair.generate()
    //fs.writeFileSync('./baseAccount.json', JSON.stringify(baseAccount.publicKey))
    console.log(baseAccount.publicKey.toString())
    console.log("Base account is: ", baseAccount.publicKey.toString())
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
  };

  const sendGif = async () => {
    console.log("Add pool clicked")
    console.log("Owners fee is: ", ownerFee)
    if (inputValue.legnth === 0) {
      console.log('No img link given');
      return;
    } 
    console.log('Gif Link: ', inputValue);
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const closeDateTime = new Date(closeDate).getTime() / 1000;
      console.log(closeDateTime)
      await program.rpc.addGif(inputValue, poolQuestion,pooldesc, winOptions, closeDateTime, verifySite, ownerFee,{
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
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

  const placeBet = async() => {
     
    console.log("Placing bet...")
    if (new Date(clickedIndex.closeDateTime * 1000) < Date.now()){
      alert("Pool closed");
      console.log("Pool Closed")
      return;
    }
    console.log("Selected prediction is: ", selectedWinner)
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const poolId = clickedIndex.poolId;
      //const transaction = new web3.Transaction();
      
      await program.rpc.placeBet(selectedWinner,poolId,stake * LAMPORTS_PER_SOL, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          player: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
      });
      console.log("bet sent");
      setSelectedWinner(null);
      setStake(0);
      setDetailView(false);
      await getGifList();
    }catch (error){
      console.log("Error placing bet: ", error)
    }
  }
  
  const addResultFunc = async() => {
    if (new Date(clickedIndex.closeDateTime * 1000) > Date.now()){
      alert("Pool must be past the close time to add a result")
      console.log("Pool must be past the close time to add a result")
      return;
    }
    
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const poolId = clickedIndex.poolId;
      await program.rpc.addResult(result, poolId,{
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("result added: ", result);
      setDetailView(false);
      setResult("");
      await getGifList();
    }catch (error){
      console.log("Error add in result: ", error);
    }
  }

  const identifyWinners = async() => {
    try {
      const provider = getProvider(); 
      const program = new Program(idl,programID, provider);
      const poolId = clickedIndex.poolId;
      await program.rpc.identifyWinner(poolId, {
        accounts:{
          baseAccount: baseAccount.publicKey,
          player: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        }
      });
      console.log("winners identified: ");
      setDetailView(false);
      setResult("");
      await getGifList();
    }catch (error) {
      console.log("Error identifying winners", error)
    }
  }

  const payPlatform = async() => {
    console.log("Pay the platform")
    const poolId = clickedIndex.poolId;
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.payPlatformLamps(poolId,{
        accounts:{
          baseAccount: baseAccount.publicKey,
          winner: catergories.platWall, // wallet to pay fees too
          systemProgram: SystemProgram.programId, 
          owner: provider.wallet.publicKey
        }
      })
    }catch(err){
      console.error("Failed to pay platform fees ", err)
    }
    
  }
  const payOwnerFees = async() =>{
    console.log("Pay the pool owners fees ")
    console.log("Owners wallet is: ", ownerWallet)
    const poolId = clickedIndex.poolId;
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.payOwnerLamps(poolId,{
        accounts:{
          baseAccount: baseAccount.publicKey,
          winner: ownerWallet, // wallet to pay fees too
          systemProgram: SystemProgram.programId, 
          owner: provider.wallet.publicKey
        }
      })
    }catch(err){
      console.error("Failed to pay owner fees ", err)
    }
    await payPlatform()
    console.log("Paid owner fees and platform fees")
  }

  const payWinners = async() =>{
    console.log("Pay the winners")
    const poolId = clickedIndex.poolId;
    
    const winnerList = clickedIndex.winners;
    console.log(winnerList)
    for (const element of winnerList){
    
      console.log(element.user)
      let user = element.user;
      let eId = element.id;
      let stakeBal = element.stakBal;
      try{
        const provider = getProvider(); 
        const program = new Program(idl,programID, provider);
        await program.rpc.payWinnerLamps(stakeBal, poolId, eId ,{
          accounts:{
            baseAccount: baseAccount.publicKey,
            winner: user,
            systemProgram: SystemProgram.programId, 
            owner: provider.wallet.publicKey
          }
        })
        console.log(element.user, " Paid")
      }catch(error){
        console.log(error)
      }
    }
    setDetailView(false);
    await getGifList();
  }

  
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
                <Form.Select value={ownerFee} onChange={e => {console.log("e.target.value", e.target.value); setOwnerFee(e.target.value);}}>
                {/* onSelectCapture={(event) => setOwnerFee(event.target.value)}> */}
                  <option>Select an option</option>
                  <option value='0'>0</option>
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
              <Form.Group>
                <Form.Label>Catergory</Form.Label>
                <Form.Select value={catergory} onChange={e=>{setCatergory(e.target.value)}}>
                  {catergories.cats.map((item,i) => (
                    <option value={item}>{item}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Sub Catergory</Form.Label>
                <Form.Select value={subCatergory} onChange={e=>{setSubCatergory(e.target.value)}}>
                  {catergories.subCats.map((item,i) => (
                    <option value={item}>{item}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
            
          </Modal.Body>
          <Modal.Footer>
          <button className="cta-button connect-wallet-button" onClick={handleClose}> Close </button>
          <Button onClick={sendGif}>Add Pool </Button>
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

  const onPoolClick = (index) =>{
    setClickedIndex(index);
    setDetailView(true);
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      //console.log(baseAccount.publicKey)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey); // await program.provider.connection.getAccountInfo(baseAccount.publicKey); //
      console.log("Got the account", account)
      console.log("Pool list? ", account.poolList)
      setGifList(account.poolList)
    }catch(error){
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  

  const renderConnectedContainer = () => {

    if (gifList === null){
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initilisation for GIF Program Account 
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
          {renderDetailView()}
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <a onClick={(index) => onPoolClick(item)} key={index}>
                <div className="gif-item" >
                  <h3 className="footer-text">{item.poolName}</h3>
                  <img src={item.imageLink} alt="Pool Image" />
                </div>
              </a>
            ))}
          </div>
        </div>
        </div>
        )
    };
  };

  
  const renderDetailView = () =>{
    if (clickedIndex === null) {
      return (
        <>
        <Modal show={detailView} fullscreen={fullscreen} onHide={() => setDetailView(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Modal</Modal.Title>
          </Modal.Header>
          <Modal.Body>Modal body content
            {/* Selected index is {clickedIndex.poolName} */}
          </Modal.Body>
        </Modal>
        </>
      )
    }else {
      return (
        <>
        <Modal show={detailView} fullscreen={fullscreen} onHide={() => setDetailView(false)}>
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body>
            <Row>
              <Col sm={8}>
                <Card>
                  <Card.Header>
                    <h2>{clickedIndex.poolName}</h2>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col sm={6}>
                        <Image src={clickedIndex.imageLink} fluid rounded/>
                        <p>{clickedIndex.poolDescription}</p>
                      </Col>
                      <Col sm={6}>
                        <p>Pool Balance: {clickedIndex.poolBalance.toNumber()/LAMPORTS_PER_SOL} SOL <small>(Before fees)</small></p>
                        
                        <p>Close Date: {new Date(clickedIndex.closeDateTime * 1000).toUTCString()} </p>
                        <p>Verfication Site: {clickedIndex.verifyUrl}</p>
                        <p>Win Options:</p>
                        <ul>
                            {clickedIndex.winOptions.map((item, index) => 
                              <li>{item}</li>
                            )   
                            }
                        </ul>
                        <p>Result: {clickedIndex.result}</p>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                          <p>Platfrom Fee: 5%</p>
                      </Col>
                      <Col>
                          <p>Pool Owner Fee: {clickedIndex.ownerFee}%</p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
                <Card >
                <fieldset disabled={clickedIndex.userAddress.toString() != walletAddress} hidden={clickedIndex.userAddress.toString() != walletAddress}>
                  <Row>
                    <p>Only visable if you are the pool owner. ie. You created this pool</p>
                    
                  <CardGroup className="text-center">
                  <Card>
                  <Card.Body>
                    <Form>
                      <Form.Group>
                        <Form.Select onChange={(event) => setResult(event.target.value)}>
                          <option>Please Pick one</option>
                          {clickedIndex.winOptions.map((item,index) =>
                            <option value={item}>{item}</option>
                          )}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group>
                        <Button onClick={addResultFunc}>Add Result</Button>
                      </Form.Group>
                      
                    </Form>
                  </Card.Body>
                  </Card>
                  
                      <Card>
                        <Card.Body>
                          <Form>
                            <Form.Group>
                              <Button onClick={identifyWinners}>Identify Winners</Button>
                            </Form.Group>
                          </Form>
                        </Card.Body>
                      </Card>
                  
                      <Card>
                        <Card.Body>
                          <Form>
                            <Form.Group>
                              <Button onClick={payWinners}>Pay Winners</Button>
                            </Form.Group>
                          </Form>
                        </Card.Body>
                      </Card>
                  </CardGroup>
                  </Row>
                  <Row>
                    <CardGroup className='text-center'>
                    <Card>
                        <Card.Body>
                          <Form>
                            <Form.Group>
                              <Form.Label>Wallet Address</Form.Label>
                              <Form.Control type="text" value={ownerWallet} onChange={e => {setOwnerWallet(e.target.value)}}></Form.Control>
                            </Form.Group>
                            <Form.Group>
                              <Button onClick={payOwnerFees}>Payout Fees</Button>
                            </Form.Group>
                          </Form>
                        </Card.Body>
                      </Card>
                      {/* <Card>
                        <Card.Body>
                          <Form>
                          <Form.Group>
                              <Form.Label>Wallet Address</Form.Label>
                              <Form.Control type="text"></Form.Control>
                            </Form.Group>
                            <Form.Group>
                              <Button onClick={payPlatform}>Pay Platform</Button>
                            </Form.Group>
                          </Form>
                        </Card.Body>
                      </Card> */}
                    </CardGroup>
                  </Row>
                  </fieldset>
                </Card>
              </Col>
              <Col sm={4}>
              
                <Card>
                  <Card.Header>
                    <h2>Make a prediction.</h2>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                    <fieldset disabled={clickedIndex.closed}>
                      <Form.Group>
                        <Form.Label>Your Selection:</Form.Label>
                        <Form.Select onChange={(event) => setSelectedWinner(event.target.value)}>
                          <option>Please Pick one</option>
                          {clickedIndex.winOptions.map((item,index) =>
                            <option value={item}>{item}</option>
                          )}
                        </Form.Select>
                        <Form.Text>Pick your winner.</Form.Text>
                      </Form.Group>
                      <Form.Group>
                        <Form.Label>Stake (SOL):</Form.Label>
                        <Form.Control type='number' value={stake} onChange={(event)=>setStake(event.target.value)}></Form.Control>
                        <Form.Text>How much you are betting in SOL.</Form.Text>
                      </Form.Group>
                      <Button variant="primary" onClick={placeBet}>
                        Submit
                      </Button>
                      </fieldset>
                    </Form>
                  </Card.Body>
                </Card>
                <fieldset hidden={!clickedIndex.closed}>
                <Card>
                  <Card.Header>
                    <h3>Winners</h3>
                  </Card.Header>
                  <Card.Body>
                    <ul>
                    {clickedIndex.winners.map((item,index) =>
                        <li>{item.user.toString()}</li>
                      )}
                    </ul>
                  </Card.Body>
                </Card>
                </fieldset>
              </Col>
            </Row>
            
          </Modal.Body>
        </Modal>
        </>
      )
    }
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
        
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
      </div>
      
      
      {/* </div> */}
    </div>
  );
};

export default App;
