"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, RefreshCw } from 'lucide-react';
import NavigationHeader from '@/components/navigation-header';

// Tic Tac Toe Game Component
const TicTacToeGame = () => {
  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // X is always the human player
  const [gameStatus, setGameStatus] = useState('');
  const [xWins, setXWins] = useState(0);
  const [oWins, setOWins] = useState(0);
  const [ties, setTies] = useState(0);
  
  // Initialize game stats from localStorage on component mount
  useEffect(() => {
    const savedXWins = localStorage.getItem('ticTacToeXWins');
    const savedOWins = localStorage.getItem('ticTacToeOWins');
    const savedTies = localStorage.getItem('ticTacToeTies');
    
    if (savedXWins) setXWins(parseInt(savedXWins));
    if (savedOWins) setOWins(parseInt(savedOWins));
    if (savedTies) setTies(parseInt(savedTies));
  }, []);
  
  // Save game stats to localStorage
  const saveStats = (x: number, o: number, t: number) => {
    localStorage.setItem('ticTacToeXWins', x.toString());
    localStorage.setItem('ticTacToeOWins', o.toString());
    localStorage.setItem('ticTacToeTies', t.toString());
  };

  // Calculate winner
  const calculateWinner = (squares: Array<string | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    
    // Check for tie (all squares filled)
    if (squares.every(square => square !== null)) {
      return 'tie';
    }
    
    return null;
  };
  
  // Find potential winning move for a player (used for AI)
  const findPotentialWin = (squares: Array<string | null>, player: string) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Look for lines where player has 2 squares and the third is empty
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      const lineSquares = [squares[a], squares[b], squares[c]];
      const playerCount = lineSquares.filter(square => square === player).length;
      const emptyCount = lineSquares.filter(square => square === null).length;
      
      // If player has 2 in a row and there's an empty square
      if (playerCount === 2 && emptyCount === 1) {
        // Find the empty position and return its index
        if (squares[a] === null) return a;
        if (squares[b] === null) return b;
        if (squares[c] === null) return c;
      }
    }
    
    return null;
  };
  
  // AI move calculation for opponent (O)
  const calculateAIMove = (squares: Array<string | null>) => {
    // First priority: Check if AI can win in this move
    const winningMove = findPotentialWin(squares, 'O');
    if (winningMove !== null) return winningMove;
    
    // Second priority: Block player's potential win
    const blockingMove = findPotentialWin(squares, 'X');
    if (blockingMove !== null) return blockingMove;
    
    // Third priority: Take center if available
    if (squares[4] === null) return 4;
    
    // Fourth priority: Take a corner if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => squares[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Last priority: Take any available square
    const availableSquares = squares.map((square, i) => square === null ? i : null).filter(i => i !== null) as number[];
    if (availableSquares.length > 0) {
      return availableSquares[Math.floor(Math.random() * availableSquares.length)];
    }
    
    return null; // Should never reach here if called correctly
  };
  
  // Make AI move after player's move
  const makeAIMove = (boardCopy: Array<string | null>) => {
    // Check if game is already over
    if (calculateWinner(boardCopy)) return boardCopy;
    
    // Calculate AI move
    const aiMoveIndex = calculateAIMove(boardCopy);
    
    // Make the move if valid
    if (aiMoveIndex !== null && boardCopy[aiMoveIndex] === null) {
      boardCopy[aiMoveIndex] = 'O';
    }
    
    return boardCopy;
  };
  
  // Handle click on a square (Player's move)
  const handleClick = (index: number) => {
    // Do nothing if square already filled or if game is over
    if (board[index] || gameStatus || !isXNext) return;
    
    // Create a copy of the board and update the clicked square
    let boardCopy = [...board];
    boardCopy[index] = 'X'; // Player is always X
    
    // Update board immediately with player's move
    setBoard(boardCopy);
    
    // Check for winner after player's move
    let winner = calculateWinner(boardCopy);
    
    // If no winner yet, make AI move after a short delay
    if (!winner) {
      // Set a "thinking" status for the AI
      setGameStatus('Hmmm...');
      
      // Add a short delay before the computer makes its move
      setTimeout(() => {
        // Make AI move
        boardCopy = makeAIMove([...boardCopy]);
        
        // Check for winner after AI move
        winner = calculateWinner(boardCopy);
        
        // Update the board with computer's move
        setBoard(boardCopy);
        
        // Update game status based on the result
        if (winner) {
          let statusText;
          let newXWins = xWins;
          let newOWins = oWins;
          let newTies = ties;
          
          if (winner === 'X') {
            statusText = 'You win!';
            newXWins += 1;
            setXWins(newXWins);
          } else if (winner === 'O') {
            statusText = 'Computer wins!';
            newOWins += 1;
            setOWins(newOWins);
          } else {
            statusText = 'Tie game!';
            newTies += 1;
            setTies(newTies);
          }
          
          setGameStatus(statusText);
          saveStats(newXWins, newOWins, newTies);
        } else {
          // Reset status to player's turn
          setGameStatus('');
        }
      }, 500); // 500ms delay - short enough to not be annoying, but long enough to be noticeable
    } else {
      // Handle case where player wins immediately
      let statusText;
      let newXWins = xWins;
      
      statusText = 'You win!';
      newXWins += 1;
      setXWins(newXWins);
      
      setGameStatus(statusText);
      saveStats(newXWins, oWins, ties);
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameStatus('');
  };
  
  // Render a square
  const renderSquare = (index: number) => {
    return (
      <button 
        className={`w-16 h-16 border-2 border-gray-500 flex items-center justify-center text-2xl font-bold transition-all
          ${board[index] === 'X' ? 'text-blue-500' : board[index] === 'O' ? 'text-primary' : 'hover:bg-primary/10'}`}
        onClick={() => handleClick(index)}
        disabled={!!board[index] || !!gameStatus}
      >
        {board[index]}
      </button>
    );
  };
  
  // Determine game status message
  const getStatusMessage = () => {
    if (gameStatus) {
      return gameStatus;
    } else {
      return 'Your turn (X)';
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      {/* Game stats */}
      <div className="text-sm mb-3 flex gap-4">
        <span className="text-blue-500 font-medium">You: {xWins}</span>
        <span className="text-primary font-medium">Me: {oWins}</span>
        <span>Ties: {ties}</span>
      </div>
      
      {/* Game status */}
      <div className={`mb-4 font-bold ${gameStatus.includes('You') ? 'text-blue-500' : gameStatus.includes('Computer') ? 'text-primary' : ''}`}>
        {getStatusMessage()}
      </div>
      
      {/* Game board */}
      <div className="grid grid-cols-3 gap-1 mb-4">
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
      
      {/* Reset button - shown always but emphasized when game is over */}
      <Button 
        onClick={resetGame} 
        size="sm" 
        variant={gameStatus ? "default" : "outline"}
        className="flex items-center gap-1"
      >
        <RefreshCw className="h-4 w-4" />
        {gameStatus ? 'Play Again' : 'Reset Game'}
      </Button>
    </div>
  );
};

export default function HomeComingSoon() {
  return (
    <>
      <NavigationHeader />
      <div className="container max-w-xl mx-auto py-6 px-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Home Page Coming Soon!
            </CardTitle>
            <CardDescription className="text-center text-sm">
              We're working on the home page. Meanwhile, enjoy a game of Tic Tac Toe!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <TicTacToeGame />
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-4">
            <Button variant="outline" onClick={() => window.history.back()} size="sm">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
