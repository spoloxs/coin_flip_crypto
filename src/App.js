import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Button, Container, Form, Navbar, Card, Spinner, Row, Col } from 'react-bootstrap';
import './App.css';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const contractABI = JSON.parse(process.env.REACT_APP_CONTRACT_ABI);

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedSide, setSelectedSide] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState(null);
  const [userWon, setUserWon] = useState(false);
  const [coinState, setCoinState] = useState('');
  const [betHistory, setBetHistory] = useState([]);

  const requestAccount = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        fetchBalance(accounts[0]);
      } catch (error) {
        console.error('User rejected the request:', error);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this app.');
    }
  };

  const fetchBalance = async (account) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(account);
    setBalance(ethers.utils.formatEther(balance));
  };

  const handleCoinFlip = async () => {
    if (!betAmount || !selectedSide) {
      alert('Please enter an amount and select a side.');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(balance)) {
      alert('Insufficient balance.');
      return;
    }

    setIsFlipping(true);
    setCoinState('rotating'); // Start rotating the coin

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const coinFlipContract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await coinFlipContract.placeBet(selectedSide === 'heads', {
        value: ethers.utils.parseEther(betAmount),
      });

      const result = await tx.wait();
      const outcome = result.events[0].args.won ? 'won' : 'lost';

      setUserWon(outcome === 'won');

      let resultSide = '';
      if (outcome === 'won') {
        setFlipResult(selectedSide);
        setCoinState(selectedSide); // Stop rotating and show the winning side
        resultSide = selectedSide;
      } else {
        const losingSide = selectedSide === 'heads' ? 'tails' : 'heads';
        setFlipResult(losingSide);
        setCoinState(losingSide); // Stop rotating and show the losing side
        resultSide = losingSide;
      }

      // Update betting history
      setBetHistory((prevHistory) => [
        ...prevHistory,
        { betAmount, selectedSide, result: outcome === 'won' ? 'Won' : 'Lost', resultSide },
      ]);

      fetchBalance(account); // Update balance after bet

    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet.');
    } finally {
      setIsFlipping(false);
    }
  };

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            fetchBalance(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkIfWalletIsConnected();
  }, []);

  return (
    <Container fluid className="mt-4">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Navbar.Brand href="#home">Crypto Coin Flip Game</Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          {account ? (
            <Navbar.Text>Connected: {account}</Navbar.Text>
          ) : (
            <Button variant="outline-light" onClick={requestAccount}>
              Connect Wallet
            </Button>
          )}
        </Navbar.Collapse>
      </Navbar>

      <Row>
        <Col md={8}>
          <Card className="text-center mb-4 shadow-lg">
            <Card.Header>Account Information</Card.Header>
            <Card.Body>
              {account ? (
                <>
                  <Card.Text>
                    <strong>Account:</strong> {account}
                  </Card.Text>
                  <Card.Text>
                    <strong>Balance:</strong> {balance} ETH
                  </Card.Text>
                </>
              ) : (
                <Card.Text>Please connect your wallet to view account details.</Card.Text>
              )}
            </Card.Body>
          </Card>

          {/* Display the animated coin */}
          <div className="coin-container mb-4">
            <div id="coin" className={coinState}>
              <div className="side-a">
                <h2>TAIL</h2>
              </div>
              <div className="side-b">
                <h2>HEAD</h2>
              </div>
            </div>
          </div>

          <Card className="mb-4 shadow-lg">
            <Card.Header>Place Your Bet</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3" controlId="formBetAmount">
                  <Form.Label>Bet Amount (ETH)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter amount to bet"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Select Side</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      label="Heads"
                      name="side"
                      type="radio"
                      id="heads"
                      value="heads"
                      onChange={(e) => setSelectedSide(e.target.value)}
                    />
                    <Form.Check
                      inline
                      label="Tails"
                      name="side"
                      type="radio"
                      id="tails"
                      value="tails"
                      onChange={(e) => setSelectedSide(e.target.value)}
                    />
                  </div>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleCoinFlip}
                  disabled={!account || isFlipping}
                >
                  {isFlipping ? <Spinner animation="border" size="sm" /> : 'Flip Coin'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {flipResult && (
            <Card className="text-center mb-4 shadow-lg">
              <Card.Header>Flip Result</Card.Header>
              <Card.Body>
                <Card.Text>
                  The coin landed on <strong>{flipResult}</strong>!
                </Card.Text>
                <Card.Text>
                  {userWon ? 'Congratulations, you won!' : 'Sorry, you lost.'}
                </Card.Text>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Betting History Sidebar */}
        <Col md={4}>
          <Card className="shadow-lg">
            <Card.Header>Betting History</Card.Header>
            <Card.Body>
              {betHistory.length > 0 ? (
                <ul className="list-group">
                  {betHistory.map((bet, index) => (
                    <li key={index} className="list-group-item">
                      <div>
                        <strong>Bet:</strong> {bet.betAmount} ETH on {bet.selectedSide}
                      </div>
                      <div>
                        <strong>Result:</strong> {bet.result} ({bet.resultSide})
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Card.Text>No betting history available.</Card.Text>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
