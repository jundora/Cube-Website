import React, { useState, useEffect, useRef } from 'react';

// Helper functions
const generateScramble = (length = 20) => {
  const moves = ["R", "L", "U", "D", "F", "B"];
  const modifiers = ["", "'", "2"];
  const scramble = [];
  let lastMove = "";

  for (let i = 0; i < length; i++) {
    let move = moves[Math.floor(Math.random() * moves.length)];
    while (move === lastMove) {
      move = moves[Math.floor(Math.random() * moves.length)];
    }
    lastMove = move;
    scramble.push(move + modifiers[Math.floor(Math.random() * modifiers.length)]);
  }
  return scramble.join(" ");
};

const getRecentTimes = (n, solves) => {
  return solves.slice(-n).map(solve => solve.time);
};

const getAverage = (times) => {
  if (times.length < 3) return 'N/A';
  let timesToAverage = [...times];
  if (times.length >= 5) {
    timesToAverage.sort((a, b) => a - b);
    timesToAverage = timesToAverage.slice(1, timesToAverage.length - 1);
  }
  const sum = timesToAverage.reduce((acc, curr) => acc + curr, 0);
  return (sum / timesToAverage.length).toFixed(2);
};


const App = () => {
  const [time, setTime] = useState(0);
  const [scramble, setScramble] = useState('');
  const [state, setState] = useState('idle');
  const [solves, setSolves] = useState([]);

  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const scrambleDisplayRef = useRef(null); // 👈 ADD THIS: Ref for the scramble-display element
  
  useEffect(() => {
    const savedSolves = JSON.parse(localStorage.getItem('csTimerSolves')) || [];
    setSolves(savedSolves);
    setScramble(generateScramble());
  }, []);

  useEffect(() => {
    localStorage.setItem('csTimerSolves', JSON.stringify(solves));
  }, [solves]);

  // 👈 ADD THIS: New useEffect to update the scramble visualization
  useEffect(() => {
    if (scrambleDisplayRef.current) {
      scrambleDisplayRef.current.setAttribute('scramble', scramble);
    }
  }, [scramble]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (state === 'idle') {
          setState('ready');
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (state === 'ready') {
          startTimer();
        } else if (state === 'timing') {
          stopTimer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(timerIntervalRef.current);
    };
  }, [state, solves, scramble]);

  const startTimer = () => {
    setState('timing');
    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setTime((Date.now() - startTimeRef.current) / 1000);
    }, 10);
  };

  const stopTimer = () => {
    clearInterval(timerIntervalRef.current);
    const finalTime = ((Date.now() - startTimeRef.current) / 1000);
    const newSolve = {
      id: Date.now(),
      time: parseFloat(finalTime),
      scramble: scramble,
      date: new Date().toLocaleString()
    };
    setSolves(prevSolves => [...prevSolves, newSolve]);
    setScramble(generateScramble());
    setTime(parseFloat(finalTime));
    setState('idle');
  };

  const ao5 = getAverage(getRecentTimes(5, solves));
  const ao12 = getAverage(getRecentTimes(12, solves));
  
  let timerColor = 'text-slate-800';
  let instructionText = "Press SPACE to get ready";
  if (state === 'ready') {
      timerColor = 'text-green-500';
      instructionText = "Release SPACE to start";
  } else if (state === 'timing') {
      timerColor = 'text-blue-500';
      instructionText = "Timing...";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 font-inter text-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-4 text-center">CS Timer</h1>
        <div className="text-center mb-6">
          <p className="text-xl font-medium">{instructionText}</p>
        </div>

        <div className="text-center mb-6">
          <p className="text-lg font-mono tracking-wider break-words">{scramble}</p>
        </div>

        {/* 👈 ADD THIS: The scramble visualization component */}
        <div className="flex justify-center mb-6">
            <scramble-display ref={scrambleDisplayRef} puzzle="3x3x3" visualization="2D"></scramble-display>
        </div>
        
        <div className="text-center mb-6">
          <h2 className={`text-7xl font-bold transition-colors duration-200 ${timerColor}`}>
            {time.toFixed(2)}
          </h2>
        </div>

        <div className="flex justify-center space-x-8 mb-6">
          <div className="text-center">
            <p className="text-lg font-semibold">Ao5: {ao5}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Ao12: {ao12}</p>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => state === 'idle' ? setState('ready') : stopTimer()}
            className="px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors duration-200"
          >
            {state === 'idle' ? "Start" : "Stop"}
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl max-h-64 overflow-y-auto border border-slate-200">
          <h3 className="text-xl font-semibold mb-2">Past Solves</h3>
          <ul className="text-sm font-mono space-y-1">
            {solves.slice().reverse().map((solve) => (
              <li key={solve.id} className="p-2 bg-slate-100 rounded-lg">
                Time: {solve.time.toFixed(2)}s | Date: {solve.date} | Scramble: {solve.scramble}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;