# battleship-game

## User Stories

### BGE

-   [ ] Caller can invoke a `startGame()` function to begin a 1-player game. This function will generate an 8x8 game board consisting of 3 ships having a width of one square and a length of:

    -   Destroyer: 2 squares
    -   Cruiser: 3 squares
    -   Battleship: 4 squares

    `startGame()` will randomly place these ships on the board in any direction and will return an array representing ship placement.

-   [ ] Caller can invoke a `shoot()` function passing the target row and column coordinates of the targeted cell on the game board. `shoot()` will return indicators representing if the shot resulted in a hit or miss, the number of ships left (i.e. not yet sunk), the ship placement array, and an updated hits and misses array.

    Cells in the hits and misses array will contain a space if they have yet to be targeted, `O` if they were targeted but no part of a ship was at that location, or `X` if the cell was occupied by part of a ship.

### Text-based Presentation Layer

-   [ ] User can see the hits and misses array displayed as a 2 dimensional character representation of the game board returned by the `startGame()` function.
-   [ ] User can be prompted to enter the coordinates of a target square on the game board.
-   [ ] User can see an updated hits and misses array display after taking a shot.
-   [ ] User can see a message after each shot indicating whether the shot resulted in a hit or miss.
-   [ ] User can see an congratulations message after the shot that sinks the last remaining ship.
-   [ ] User can be prompted to play again at the end of each game. Declining to play again stops the game.

## Bonus features

### BGE

-   [ ] Caller can specify the number of rows and columns in the game board as a parameter to the `startGame()` function.
-   [ ] Caller can invoke a `gameStats()` function that returns a Javascript object containing metrics for the current game. For example, number of turns played, current number of hits and misses, etc.
-   [ ] Caller can specify the number of players (1 or 2) when calling `startGame()` which will generate one board for each player randomly populated with ships.

    `shoot()` will accept the player number the shot is being made for along with the coordinates of the shot. The data it returns will be for that player.

### Text-based Presentation Layer

-   [ ] User can see the current game statics at any point by entering the phrase `stats` in place of target coordinates. (Note that this requires the `gameStats()` function in the BGE)
-   [ ] User can specify a two player game is to be played, with each player alternating turns in the same terminal session (Note that this requires corresponding Bonus Features in the BGE)
-   [ ] User can see the player number in prompts associated with the inputs in each turn.
-   [ ] User can see both players boards at the end of each turn.
