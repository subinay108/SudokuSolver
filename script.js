const demo = document.getElementById('demo');
const keypad = document.querySelectorAll('.keypad button');
const eraseBtn = document.getElementById('eraseBtn');
const resetBtn = document.getElementById('resetBtn');
const uploadFile = document.getElementById('upload');
const cameraFile = document.getElementById('camera');

function select(str){
    let row = parseInt(str[1]);
    let col = parseInt(str[3]);
    activeCell[0] = row;
    activeCell[1] = col;
    drawSudoku(sCurrent);
}

// let previousKey = undefined;
keypad.forEach((key, index) =>{
    key.addEventListener('mousedown', e => {
        sCurrent.input((index + 1));
        // if(index == 0){
        //     sCurrent.input(1);
        // }
        console.log(index + 1);
        // key.style.backgroundColor = '#e6e6e6';
        // previousKey = key;
    });
});

// let prKey = undefined;
eraseBtn.addEventListener('mousedown', e => {
    sCurrent.input((0));
    // console.log(index + 1);
    // key.style.backgroundColor = '#e6e6e6';
    // previousKey = key;
});
resetBtn.addEventListener('mousedown', e => {
    uploadFile.value = '';
    cameraFile.value = '';
    sCurrent = new Sudoku();
    drawSudoku(sCurrent);
    console.log(e.target);
    // console.log(index + 1);
    // key.style.backgroundColor = '#e6e6e6';
    // previousKey = key;
});


// selecting loading div
const loader = document.querySelector('#loading');

// showing loading
function displayLoading(){
    demo.innerHTML += '<div id="loading"><div></div></div>';
    // to stop loading after some time
    // setTimeout(() => {
    //     loader.classList.remove('display');
    // }, 5000);
}

// hiding loading
function hideLoading(){
    loader.classList.remove('display');
}

uploadFile.addEventListener('change', (e) =>{
    processImage(e.target);
}
);

cameraFile.addEventListener('change', (e) =>{
    processImage(e.target);
}
);

async function processImage(input){
    displayLoading();
    sCurrent.editable = false;
    // get file and detectText
    const file = input.files[0];
    if (!file) {
        alert('Please select an image file.');
        return;
    }
    
    const imgObject = new Image();
    imgObject.src = URL.createObjectURL(file);
    imgObject.onload = () => {
        const img = cv.imread(imgObject);
        const board = detectText(img);
        if(board != undefined){
            sCurrent = new Sudoku(board);
            // Snackbar alert for sudoku is loaded
            new Alert({
                type: 'success',
                message: 'Sudoku is loaded',
                expires: true,
                duration: 2,
                container: '.snackbar',
            });
        }else{
            // Snackbar alert for Can't detect Sudoku
            new Alert({
                type: 'error',
                message: "Can't detect Sudoku",
                expires: true,
                duration: 2,
                container: '.snackbar',
            });
        }
        drawSudoku(sCurrent);
    };
}

window.addEventListener('keydown', (e) => {
    // console.log(e.key);
    let i = activeCell[0];
    let j = activeCell[1];
    switch(e.key){
        case '1': 
            sCurrent.input(1, i, j);
            break;
        case '2': 
            sCurrent.input(2, i, j);
            break;
        case '3': 
            sCurrent.input(3, i, j);
            break;
        case '4':
            sCurrent.input(4, i, j);
            break;
        case '5':
            sCurrent.input(5, i, j);
            break;
        case '6': 
            sCurrent.input(6, i, j);
            break;
        case '7':
            sCurrent.input(7, i, j);
            break;
        case '8':
            sCurrent.input(8, i, j);
            break;
        case '9':
            sCurrent.input(9, i, j);
            break;
        case 'Backspace':
            sCurrent.input(0, i, j);
            break;
        
        case "ArrowUp":
            e.preventDefault();
            if(activeCell[0] != 0){
                activeCell[0] -= 1;
                drawSudoku(sCurrent);
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if(activeCell[0] != 8){
                activeCell[0] += 1;
                drawSudoku(sCurrent);
            }
            break;
        case 'ArrowLeft':
            if(activeCell[1] != 0){
                activeCell[1] -= 1;
                drawSudoku(sCurrent);
            }
            break;
        case 'ArrowRight':
            if(activeCell[1] != 8){
                activeCell[1] += 1;
                drawSudoku(sCurrent);
            }
            break;
        default:
            console.log('Invalid input');
    }
});


class Sudoku{
    constructor(board){
        if(board == undefined){
            this.board = [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]                     
             ];
        }
        else{
            this.board = board;
        }
        
        this.original = JSON.parse(JSON.stringify(this.board));
        this.searchSpace = this.getSearchSpace();
        this.editable = true;
    }
    input(element){
        // if board is not editable then return
        if(!this.editable){
            return;
        }
        // else insert the element in board
        let row = activeCell[0];
        let col = activeCell[1];
        if(this.board[row][col] == element){
            element = 0;
        }
        this.board[row][col] = element;
        this.searchSpace = this.getSearchSpace();
        drawSudoku(this); 
    }
    getSearchSpace(){
        let searchSpace = new Array(9);
        for(let i = 0; i < 9; i++){
            searchSpace[i] = new Array(9);
            for(let j = 0; j < 9; j++){
                searchSpace[i][j] = new Array();
                if(this.board[i][j] === 0){
                    for(let k = 1; k <= 9; k++){
                        if(!this.hasRow(k, i) &&
                           !this.hasCol(k, j) &&
                           !this.hasBlock(k, i, j)){
                            searchSpace[i][j].push(k);
                        }
                    }
                }
            }
        }
        return searchSpace;
    }
    updateSearchSpace(element, row, col){
        // check row
        for(let j = 0; j < 9; j++){
            if(this.board[row][j] == 0){
                this.searchSpace[row][j].forEach((el, index) =>{
                    if(el == element){
                        this.searchSpace[row][j].splice(index, 1);
                    }
                });
            }
        }

        // check col
        for(let i = 0; i < 9; i++){
            if(this.board[i][col] == 0){
                this.searchSpace[i][col].forEach((el, index) =>{
                    if(el == element){
                        this.searchSpace[i][col].splice(index, 1);
                    }
                });
            }
        }

        // check block
        let x = 3 * Math.floor(row / 3);
        let y = 3 * Math.floor(col / 3);
        for(let i = x; i < (x + 3); i++){
            for(let j = y; j < (y + 3); j++){
                if(this.board[i][j] === 0){
                    this.searchSpace[i][j].forEach((el, index) =>{
                        if(el == element){
                            this.searchSpace[i][j].splice(index, 1);
                        }
                    });
                }
            }
        }
        
    }
    hasRow(element, row){
        for(let j = 0; j < 9; j++){
            if(this.board[row][j] === element){
                return true;
            }
        }
        return false;
    }
    hasCol(element, col){
        for(let i = 0; i < 9; i++){
            if(this.board[i][col] === element){
                return true;
            }
        }
        return false;
    }
    hasBlock(element, row, col){
        let x = Math.floor(row / 3);
        let y = Math.floor(col / 3);
        for(let i = 0; i < 3; i++){
            for(let j = 0; j < 3; j++){
                if(this.board[i + 3 * x][j + 3 * y] === element){
                    return true;
                }
            }
        }
        return false;
    }

    getFitness(){
        let fitness = 0;
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                if(this.board[i][j] == 0){
                    fitness++;
                }
            }
        }
        return fitness;
    }

    solve(){
        let fitness = sCurrent.getFitness();
        while(true){
            this.applyHeuristics();
            let newFitness = this.getFitness();
            if(fitness == 0){
                break;
            }
            if(fitness == newFitness){
                break;
            }
            fitness = newFitness;
        }
    }

    isCorrect(){
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                if(this.board[i][j] == 0){
                    if(this.searchSpace[i][j].length == 0){
                        return false;
                    }
                }
            }
        }
        return true;
    }
    applyHeuristics(){
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                if(this.searchSpace[i][j].length == 1){
                    let el = this.searchSpace[i][j].pop();
                    this.board[i][j] = el;
                    // document.getElementById(`r${i}c${j}`).innerHTML = `
                    // <div class="solved" style="color: blue">${el}</div>
                    // `;
                    this.updateSearchSpace(el,i,j);
                }
            }
        }

        // row hidden single
        for(let i = 0; i < 9; i++){
            for(let k = 1; k <= 9; k++){
                // if k is in the row
                let count = 0;
                for(let j = 0; j < 9; j++){
                    if(this.board[i][j] == 0){
                        if(this.searchSpace[i][j].find(e => e == k)){
                            count++;
                        }
                        if(count > 1){
                            break;
                        }
                    }
                }
                if(count == 1){
                    for(let j = 0; j < 9; j++){
                        if(this.board[i][j] == 0){
                            if(this.searchSpace[i][j].find(e => e == k)){
                                this.board[i][j] = k;
                                this.searchSpace[i][j] = [];
                                this.updateSearchSpace(k,i,j);
                                break;
                            }
                        }
                    }   
                }
            }
        }

        // col hidden single
        for(let j = 0; j < 9; j++){
            for(let k = 1; k <= 9; k++){
                // if k is in the row
                let count = 0;
                for(let i = 0; i < 9; i++){
                    if(this.board[i][j] == 0){
                        if(this.searchSpace[i][j].find(e => e == k)){
                            count++;
                        }
                        if(count > 1){
                            break;
                        }
                    }
                }
                if(count == 1){
                    for(let i = 0; i < 9; i++){
                        if(this.board[i][j] == 0){
                            if(this.searchSpace[i][j].find(e => e == k)){
                                this.board[i][j] = k;
                                this.searchSpace[i][j] = [];
                                this.updateSearchSpace(k,i,j);
                                break;
                            }
                        }
                    }   
                }
            }
        }
    }
    getFirstEmptyCell(){
        let row, col;
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                if(this.board[i][j] == 0){
                    row = i;
                    col = j;
                    return [row, col];
                }
            }
        }
    }
    dfsHybrid(depth){
        console.log('depth', depth);
        // if(!this.isCorrect()){ //base case
        //     console.log('dead end');
        //     return;
        // }
        
        let [row, col] = this.getFirstEmptyCell();
        let arr = JSON.parse(JSON.stringify(this.searchSpace[row][col]));
        for(let el of arr){
            console.log(row, col, el);
            // put one guess
            let tempBoard = JSON.stringify(this.board);
            let tempSpace = JSON.stringify(this.searchSpace);
            
            if(row == 0 && col == 1 && el == 8){
                console.log('before',this.isCorrect(), 
                tempBoard);
            }

            this.board[row][col] = el;
            this.searchSpace[row][col] = [];
            this.updateSearchSpace(el, row, col);
            
            // apply heuristics
            this.solve();

            // if fitness is 0 then return
            if(this.getFitness() == 0){
                return;
            }
            if(row == 0 && col == 1 && el == 8){
                console.log('after',this.isCorrect(), this.board);
            }

            // if board is correct then dfsHybrid 
            // else revert the board and proceed to next guess
            if(this.isCorrect()){
                this.dfsHybrid(depth + 1);
                console.log('depth', depth);
                if(this.getFitness() == 0){
                    return;
                }else{
                    this.board = JSON.parse(tempBoard);
                    this.searchSpace = JSON.parse(tempSpace);
                }
            }else{
                this.board = JSON.parse(tempBoard);
                this.searchSpace = JSON.parse(tempSpace);
            }
        }
    }
}

//extreme
let sCurrent = new Sudoku(
                    [[5,0,0,0,0,0,0,0,9],
                    [0,9,0,8,0,4,0,3,0],
                    [0,0,8,0,9,0,4,0,0],
                    [0,3,0,7,0,2,0,4,0],
                    [0,0,2,0,0,0,9,0,0],
                    [0,8,0,1,0,9,0,7,0],
                    [0,0,9,0,5,0,6,0,0],
                    [0,1,0,9,0,6,0,5,0],
                    [7,0,0,0,0,0,0,0,8]]
);

function getActiveArea(cell){
    let arr = [];
    for(let row = 0; row < 9; row++){
        if(row != cell[0]){
            arr.push([row, cell[1]]);
        }
    }
    for(let col = 0; col < 9; col++){
        if(col != cell[1]){
            arr.push([cell[0], col]);
        }
    }
    let x = 3 * Math.floor(cell[0] / 3);
    let y = 3 * Math.floor(cell[1] / 3);
    for(let i = x; i < x + 3; i++){
        if( i != cell[0]){
            for(let j = y; j < y + 3; j++){
                if(j != cell[1]){
                    arr.push([i, j]);
                }
            }
        }
    }
    return arr;
}
function getSameNumber(cell){
    let el = sCurrent.board[cell[0]][cell[1]];
    if(el == 0){
        return [];
    }
    let arr = [];
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            if(sCurrent.board[i][j] == el){
                arr.push([i, j]);
            }
        }
    }
    return arr;
}
function getWrongCell(){
    // search the board and find all the wrong cells and return
    const wrongCell = new Set();
    for(let row = 0; row < 9; row++){
        for(let col = 0; col < 9; col++){
            let element = sCurrent.board[row][col];
            // continue if that cell is already wrong
            // or if the element is 0
            if(element == 0 ||wrongCell.has([row, col])){
                continue;
            }
            let flag = 1;
            // col check
            for(let i = 0; i < 9; i++){
                if(i != row && sCurrent.board[i][col] == element){
                    wrongCell.add([row, col]);
                    wrongCell.add([i, col]);
                    flag = 0;
                    break;
                }
            }
            // row check
            if(flag){
                for(let j = 0; j < 9; j++){
                    if(j != col && sCurrent.board[row][j] == element){
                        wrongCell.add([row, col]);
                        wrongCell.add([row, j]);
                        break;
                    }
                }
            }
            // block check
            if(flag){
                let x = 3 * Math.floor(row / 3);
                let y = 3 * Math.floor(col / 3);
                for(let i = x; i < (x + 3); i++){
                    for(let j = y; j < (y + 3); j++){
                        if((i != row || j != col) && sCurrent.board[i][j] === element){
                            wrongCell.add([row, col]);
                            wrongCell.add([i, j]);
                            break;
                        }
                    }
                }
            }
        }
    }
    return wrongCell;
}

function drawSudoku(sudoku){
    let innerContent = '';
    for(let x = 0; x < 3; x++){
        for(let y = 0; y < 3; y++){
            innerContent += '<div class="block">';
            for(let i = 0; i < 3; i++){
                for(let j = 0; j < 3; j++){
                    let r = i + 3 * x;
                    let c = j + 3 * y;
                    innerContent += `<div class="cell" id="r${r}c${c}" onclick="select('r${r}c${c}')">`;
                    if(sudoku.board[r][c]){
                        innerContent += `<span class="solved">
                        ${sudoku.board[r][c]}
                        </span>`;
                    }
                    else{
                        for(let k = 1; k < 10; k++){
                            innerContent += `<div class="empty">
                            ${sCurrent.searchSpace[r][c].find(e => e == k) ? k : ' '}
                            </div>`;
                        }
                    }
                    innerContent += '</div>';
                }
            }
            innerContent += '</div>';
        }
    }
    demo.innerHTML = innerContent;
    document.getElementById(`r${activeCell[0]}c${activeCell[1]}`).classList.add('active');
    getActiveArea(activeCell).forEach(cell =>{
        document.getElementById(`r${cell[0]}c${cell[1]}`).classList.add('active-area');
    });
    getSameNumber(activeCell).forEach(cell => {
        document.getElementById(`r${cell[0]}c${cell[1]}`).classList.add('same-number');
    });
    // for(let key in wrongCellArea){
    //     let el = document.querySelector(`#r${key[0]}c${key[1]} span`); 
    //     el.classList.add('wrong-text');
    //     for(let cell of wrongCellArea[key]){
    //         document.getElementById(`r${cell[0]}c${cell[1]}`).classList.add('wrong-cell');
    //     }
    // }
    isValidInput = true;
    getWrongCell().forEach(cell => {
        document.querySelector(`#r${cell[0]}c${cell[1]}`).classList.add('wrong-cell');
        document.querySelector(`#r${cell[0]}c${cell[1]} span`).classList.add('wrong-text');
        isValidInput = false;
    });
}


// active select color - #80bfff
// selected number on other - #99c2ff
// active area color - #cce6ff

// main program
let activeCell = [0 , 0];
let activeArea = getActiveArea(activeCell);
let isValidInput = true;

function solveSudoku(){
    // Snackbar alert for Too less input
    if(sCurrent.board.toString().split(',').filter(x => x == '0').length > 64){
        new Alert({
            type: 'warning',
            message: 'Too less Input',
            expires: true,
            duration: 1,
            container: '.snackbar',
        });
        return;
    }

    // Snackbar alert for solved sudoku
    if(sCurrent.board.toString().split(',').filter(x => x == '0').length == 0){
        new Alert({
            type: 'warning',
            message: 'Already Solved',
            expires: true,
            duration: 1,
            container: '.snackbar',
        });
        return;
    }

    // Snackbar alert for invalid input
    if(!isValidInput){
        new Alert({
            type: 'error',
            message: 'Invalid Input',
            expires: true,
            duration: 1,
            container: '.snackbar',
        });
        return;
    }
    let fitness = sCurrent.getFitness();
    sCurrent.original = JSON.parse(JSON.stringify(sCurrent.board));
    sCurrent.editable = false;
    const start = performance.now();
    while(true){
        sCurrent.applyHeuristics();
        let newFitness = sCurrent.getFitness();
        if(fitness == 0){
            break;
        }
        if(fitness == newFitness){
            sCurrent.dfsHybrid(0);
            break;
        }
        fitness = newFitness;
    }
    const end = performance.now();
    sCurrent.editable = true;
    drawSudoku(sCurrent);
    //Snackbar alert for invalid sudoku
    if(sCurrent.board.toString().split(',').filter(x => x == '0').length > 0){
        sCurrent = new Sudoku(JSON.parse(JSON.stringify(sCurrent.original)));
        drawSudoku(sCurrent);
        new Alert({
            type: 'error',
            message: 'Invalid Sudoku',
            expires: true,
            duration: 1,
            container: '.snackbar',
        });
        return;
    }

    // adding blue text color for solved cell
    // adding digit animation
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            if(sCurrent.original[i][j] == 0){
                document.querySelector(`#r${i}c${j} span`).classList.add('unsolved-cell');
                animateDigit(document.querySelector(`#r${i}c${j} span`), sCurrent.board[i][j], 1);           
            }
        }
    }
    
    // Snackbar alert for Solve time
    // wait for 0.9s for digit animation
    setTimeout(() => {
        new Alert({
            type: 'success',
            message: `Solved in ${Math.round((end - start) * 100) / 100}ms`,
            expires: true,
            duration: 2,
            container: '.snackbar',
        });
    },900);
    
}

function animateDigit(self, num, i){
    if(i < num){
        self.innerText = i;
        //Math.floor(Math.random() * 9 + 1);
        setTimeout(() => animateDigit(self, num, i + 1), 100);
    }else{
        self.innerText = i;
    }
}
//main program start here
drawSudoku(sCurrent);
