let grid = []

//default grid setup
const initGrid = function(){
	grid = [];
  for(let x=0; x<9; x++){
    let col = [];
    for(let y=0; y<9; y++){
      let el = {};
      el.locked = false;
      el.value = 0;
      el.location = document.querySelector("#r" + (y+1) + "c" + (x+1));
      el.location.style.fontWeight = "";
      col.push(el);
    }
    grid.push(col);
  }
  defaultPuzzle();
  displayGrid();  
}

const restartGrid = function(){
  for (let x=0; x<9; x++){
    for (let y=0; y<9; y++){
      if (grid[x][y].locked === false) grid[x][y].value = 0;
    }
  }
  displayGrid();
}

const displayGrid = function(){
  for(let x=1; x<10; x++){
    for(let y=1; y<10; y++){
    	if (grid[x-1][y-1].value){
      		document.querySelector("#r" + y + "c" + x).textContent = grid[x-1][y-1].value;
      	}
      	else{
      		document.querySelector("#r" + y + "c" + x).textContent = '';
      	}
    }
  }
}

const setupGridCord = function(x, y, val){
  if(val !== 0){
  grid[x-1][y-1].locked = true;
  grid[x-1][y-1].location.style.fontWeight = "bold";
  }
  else{
  grid[x-1][y-1].locked = false;
  grid[x-1][y-1].location.style.fontWeight = "normal";
  }
  grid[x-1][y-1].value = val;
}

const defaultPuzzle = function(){
  setupGridCord(2, 1, 4);
  setupGridCord(6, 1, 6);
  setupGridCord(3, 2, 2);
  setupGridCord(4, 2, 7);
  setupGridCord(7, 2, 9);
  setupGridCord(9, 2, 5);
  setupGridCord(4, 3, 2);
  setupGridCord(6, 3, 8);
  setupGridCord(7, 3, 1);
  setupGridCord(8, 3, 6);
  setupGridCord(1, 4, 2);
  setupGridCord(2, 4, 9);
  setupGridCord(3, 4, 4);
  setupGridCord(5, 4, 5);
  setupGridCord(6, 4, 3);
  setupGridCord(7, 4, 6);
  setupGridCord(8, 4, 7);
  setupGridCord(1, 5, 6);
  setupGridCord(3, 5, 1);
  setupGridCord(5, 5, 7);
  setupGridCord(6, 5, 2);
  setupGridCord(7, 5, 3);
  setupGridCord(8, 5, 8);
  setupGridCord(9, 5, 9);
  setupGridCord(2, 6, 8);
  setupGridCord(5, 6, 1);
  setupGridCord(6, 6, 9);
  setupGridCord(1, 7, 4);
  setupGridCord(2, 7, 7);
  setupGridCord(7, 7, 8);
  setupGridCord(9, 7, 6);
  setupGridCord(4, 8, 9);
  setupGridCord(8, 8, 5);
  setupGridCord(1, 9, 5);
  setupGridCord(3, 9, 6);
  setupGridCord(6, 9, 7);
  displayGrid();
}


//button setup
window.addEventListener("load", function(){

	document.querySelector("#instant").addEventListener("click", function(){
		document.querySelector("#reset").click();
		solveN(grid);
		displayGrid();
	});

	document.querySelector("#reset").addEventListener("click", function(){
		if(gridloop){
			clearInterval(gridloop);
			resetBoardSteps();
		}
    restartGrid();
	})

	document.querySelector("#steps").addEventListener("click", function(){
		gridloop = setInterval(function(){solve()}, 100);
	})

  document.querySelector("#new").addEventListener("click", function(){
    getNewGrid();
  })

});

//API setup

async function getNewGrid(){
  let response = await fetch("https://sugoku.herokuapp.com/board?difficulty=random");
  let data = await response.json();
  for(let r=0; r<9; r++){
    for(let c=0; c<9; c++){
      setupGridCord(c+1, r+1, data.board[r][c]);
    }
  }
  displayGrid();

}



//instant solving algorithm
function solveN(board){

  let emptySpot = nextEmptySpotN(board);
    let row = emptySpot[0];
    let col = emptySpot[1];

    // there is no more empty spots
    if (row === -1){
        return board;
    }

    for(let num = 1; num<=9; num++){
        if (checkValueN(board, row, col, num)){
            board[row][col].value = num;
            solveN(board);
        }
    }

    if (nextEmptySpotN(board)[0] !== -1)
        board[row][col].value = 0;

    return board;
}


function nextEmptySpotN(board) {
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            if (board[i][j].value === 0) 
                return [i, j];
        }
    }
    return [-1, -1];
}

function checkRowN(board, row, value){
    for(var i = 0; i < board[row].length; i++) {
        if(board[row][i].value === value) {
            return false;
        }
    }
   
    return true;
}

function checkColumnN(board, column, value){
    for(var i = 0; i < board.length; i++) {
        if(board[i][column].value === value) {
            return false;
        }
    }

    return true;
};

function checkSquareN(board, row, column, value){
    boxRow = Math.floor(row / 3) * 3;
    boxCol = Math.floor(column / 3) * 3;
    
    for (var r = 0; r < 3; r++){
        for (var c = 0; c < 3; c++){
            if (board[boxRow + r][boxCol + c].value === value)
                return false;
        }
    }

    return true;
};

function checkValueN(board, row, column, value) {
    if(checkRowN(board, row, value) &&
      checkColumnN(board, column, value) &&
      checkSquareN(board, row, column, value)) {
        return true;
    }
    
    return false; 
};


// show solution steps (bruteforce & backtracing)

let gridloop = null;
let state = "searching" // searching, testing, validating, error
let currentPos = {x: 0, y: 0};
let validatePos = {x: null, y: null};
let validate = "row" // row, col, block, valid
let prevPos = {x: 8, y: 8};

const solve = function(){

  if(state === "searching"){
    grid[currentPos.x][currentPos.y].location.classList.add("pointer");

    grid[prevPos.x][prevPos.y].location.classList.remove("pointer");

    if(grid[currentPos.x][currentPos.y].value === 0){
      state = "testing";
    }
    else{
      incrementCurrentPos();
    }

  }

  else if(state === "testing"){
    grid[currentPos.x][currentPos.y].location.classList.add("live");
    if(!grid[currentPos.x][currentPos.y].value){
      grid[currentPos.x][currentPos.y].value = 1;
    }
    else if (grid[currentPos.x][currentPos.y].value < 9){
      grid[currentPos.x][currentPos.y].value++;
    }
    else{
      state = "error";
      return;
    }
      state = "validating";
      validatePos.x = 0;
      validatePos.y = currentPos.y;
      displayGrid();
  }

  else if(state === "validating"){

    if(validate === "row"){
      checkRow();
    }
    else if(validate === "col"){
      checkCol();
    }
    else if(validate === "block"){
      checkBlock();
    }
    else{
      state = "searching";
      validate = "row";
      clearValidation();
      grid[currentPos.x][currentPos.y].location.classList.remove("live");
      incrementCurrentPos();
    }

  }

  else if(state === "error"){
    if(grid[currentPos.x][currentPos.y].value < 9){
      grid[currentPos.x][currentPos.y].value++;
      clearValidation();
      state = "validating";
      validate = "row";
      displayGrid();
    }
    else{
      grid[currentPos.x][currentPos.y].value = 0;
      clearValidation();
      state = "backtracing";
      validate = "row";
      decrementCurrentPos();
      displayGrid();
    }
  }

  else if(state === "backtracing"){
    grid[currentPos.x][currentPos.y].location.classList.add("pointer");

    grid[prevPos.x][prevPos.y].location.classList.remove("pointer", "live");

    if(grid[currentPos.x][currentPos.y].locked === false){
      state = "testing";
    }
    else{
      decrementCurrentPos();
    }

  }
  else{
    clearInterval(gridloop);
    grid[currentPos.x][currentPos.y].location.classList.remove("pointer");
  }

}

function decrementCurrentPos(){
  prevPos.x = currentPos.x;
  prevPos.y = currentPos.y;
  if (currentPos.x > 0){
    currentPos.x--;
  }
  else if(currentPos.y > 0){
    currentPos.x = 8;
    currentPos.y--;
  }
  else{
    state = "void";
  }
}

function clearValidation(){
  for(let y=0; y<9; y++){
    for(let x=0; x<9; x++){
      grid[x][y].location.classList.remove("valid");
      grid[x][y].location.classList.remove("invalid");
    }
  }
  validatePos.x = 0;
  validatePos.y = currentPos.y;
}

function resetBoardSteps(){
  for(let y=0; y<9; y++){
    for(let x=0; x<9; x++){
      grid[x][y].location.classList.remove("valid");
      grid[x][y].location.classList.remove("invalid");
      grid[x][y].location.classList.remove("pointer");
      grid[x][y].location.classList.remove("live");
    }
  }
   gridloop = null;
 state = "searching" // searching, testing, validating, error
 currentPos = {x: 0, y: 0};
 validatePos = {x: null, y: null};
 validate = "row" // row, col, block, valid
 prevPos = {x: 8, y: 8};
}

function checkBlock(){

  if (validatePos.x === currentPos.x || validatePos.y === currentPos.y){
    nextBlock(true);
    return;
  }

  if (grid[validatePos.x][validatePos.y].value !== grid[currentPos.x][currentPos.y].value){
    grid[validatePos.x][validatePos.y].location.classList.add("valid");
    nextBlock();
  }
  else{
    grid[validatePos.x][validatePos.y].location.classList.add("invalid");
    state = "error";
  }

}

function nextBlock(recur){
  if(validatePos.x % 3 === 2 && validatePos.y % 3 ===2){
    validate = "valid";
    if(recur) solve();
  }
  else if(validatePos.x % 3 === 2){
    validatePos.x -= 2;
    validatePos.y++;
    if(recur) checkBlock();
  }
  else{
    validatePos.x++;
    if(recur) checkBlock();

  }
}

function getBlockStart(z){
  return (3 * parseInt(z / 3));
}

function checkCol(){
  if(validatePos.y === currentPos.y){
    if (validatePos.y !== 8){
      validatePos.y++;
    }
    else{
      validatePos.x = getBlockStart(currentPos.x);
      validatePos.y = getBlockStart(currentPos.y);
      validate = "block";
    }
  }
  if(grid[validatePos.x][validatePos.y].value !== grid[currentPos.x][currentPos.y].value){
    grid[validatePos.x][validatePos.y].location.classList.add("valid");
    if(validatePos.y === 8){
      validate = "block";
      validatePos.x = getBlockStart(currentPos.x);
      validatePos.y = getBlockStart(currentPos.y);
    }
    else{
      validatePos.y++;
    }
  }
  else{
    grid[validatePos.x][validatePos.y].location.classList.add("invalid");
    state = "error";
  }
}

function checkRow(){

  if(validatePos.x === currentPos.x){
    if(validatePos.x !== 8){
      validatePos.x++;
    }
    else{
      validate = "col";
      validatePos.x = currentPos.x;
      validatePos.y = 0;
      return;
    }
  }
  if(grid[validatePos.x][validatePos.y].value !== grid[currentPos.x][currentPos.y].value){
    grid[validatePos.x][validatePos.y].location.classList.add("valid");
    if(validatePos.x === 8){
      validate = "col";
      validatePos.x = currentPos.x;
      validatePos.y = 0;
    }
    else{
      validatePos.x++;
    }
  }
  else{
    grid[validatePos.x][validatePos.y].location.classList.add("invalid");
    state = "error";
  }

}

function incrementCurrentPos(){
  prevPos.x = currentPos.x;
  prevPos.y = currentPos.y;
  if (currentPos.x < 8){
    currentPos.x++;
  }
  else if(currentPos.y < 8){
    currentPos.x = 0;
    currentPos.y++;
  }
  else{
    state = "solved";
  }
}