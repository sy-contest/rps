let database;
let currentGameId = null;
let currentPlayer = null;

// Fetch Firebase config from server
fetch('/config')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(firebaseConfig => {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        initializeEventListeners();
    })
    .catch(error => {
        console.error('Error loading Firebase config:', error);
        alert('Failed to load Firebase configuration. Please try again later.');
    });

function initializeEventListeners() {
    document.getElementById('login-button').addEventListener('click', login);

    const choiceButtons = document.querySelectorAll('.choice');
    choiceButtons.forEach(button => {
        button.addEventListener('click', () => makeChoice(button.dataset.choice));
    });
}

function login() {
    const username = document.getElementById('username').value;
    const gameId = document.getElementById('game-id').value;

    if (!username || !gameId) {
        alert('Please enter both username and game ID');
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, game_id: gameId }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            currentGameId = gameId;
            currentPlayer = data.player;
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('game-area').style.display = 'grid';
            updateGameDisplay(data.game);
            listenForGameUpdates();
        } else {
            alert(data.message || 'Failed to login');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while logging in: ' + error.message);
    });
}

function updateGameDisplay(game) {
    if (!game) return;

    const opponentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
    
    const opponentNameElement = document.getElementById('opponent-name');
    if (opponentNameElement) {
        opponentNameElement.textContent = game[opponentPlayer] || 'Waiting for opponent...';
    }

    const playerNameElement = document.getElementById('player-name');
    if (playerNameElement) {
        playerNameElement.textContent = game[currentPlayer] || '';
    }

    const opponentChoiceElement = document.getElementById('opponent-choice');
    if (opponentChoiceElement) {
        opponentChoiceElement.textContent = game[`${opponentPlayer}_choice`] ? 'Made a choice' : 'Waiting for choice...';
    }

    // Update scores
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    if (player1ScoreElement) {
        player1ScoreElement.textContent = `Player 1 Score: ${game.player1_score || 0}`;
    }
    if (player2ScoreElement) {
        player2ScoreElement.textContent = `Player 2 Score: ${game.player2_score || 0}`;
    }

    // Check if game is finished
    if (game.status === 'finished') {
        showResult(`Game Over! Winner: ${game.winner}`);
    }
}

function listenForGameUpdates() {
    if (!database || !currentGameId) return;

    const gameRef = database.ref(`games/${currentGameId}`);
    gameRef.on('value', (snapshot) => {
        const game = snapshot.val();
        if (game) {
            updateGameDisplay(game);
        }
    });
}

function makeChoice(choice) {
    console.log(`Choice made: ${choice}`);
    
    if (!currentGameId || !currentPlayer) {
        console.error('Game not initialized properly');
        return;
    }

    fetch('/make_choice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ choice: choice }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'An error occurred while making a choice');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Choice made successfully');
            if (data.round_winner) {
                console.log(`Round finished. Winner: ${data.round_winner}`);
                showResult(`Round winner: ${data.round_winner}`);
            }
        } else {
            console.error('Error making choice:', data.message);
            alert('Error making choice: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while making a choice: ' + error.message);
    });
}

function showResult(message) {
    const resultElement = document.getElementById('result');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.style.display = 'block';
        setTimeout(() => {
            resultElement.style.display = 'none';
        }, 3000); // Hide after 3 seconds
    }
}

// Other functions as needed...