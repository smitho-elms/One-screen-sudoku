let puzzle = null;
let solution = null; 

function createEmptyGrid(){
  const g = [];
  for(let r=0;r<9;r++){
    g.push(new Array(9).fill(0));
  }
  return g;
}

const sudokuEl = document.getElementById('sudoku');
const statusEl = document.getElementById('status');
let selectedCell = null;

function renderGrid(){
  sudokuEl.innerHTML = '';
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const idx = r*9 + c + 1;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      

      const val = puzzle[r][c];
      if(val && val>0){
        cell.classList.add('given');
        cell.textContent = val;
        cell.setAttribute('aria-label', `Given ${val} at row ${r+1} column ${c+1}`);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.id = `cell-${r}-${c}`;
        input.setAttribute('aria-label', `Row ${r+1} Column ${c+1}`);
        input.addEventListener('input', onCellInput);
        input.addEventListener('focus', ()=>selectCell(r,c));
        input.addEventListener('keydown', onCellKeyDown);
        cell.appendChild(input);
      }

      cell.addEventListener('click', ()=>{
        const inp = cell.querySelector('input');
        if(inp){ inp.focus(); }
      });

      sudokuEl.appendChild(cell);
    }
  }
}

function onCellInput(e){
  const input = e.target;
  let v = input.value.replace(/[^1-9]/g,'');
  if(v.length>1) v = v.slice(-1);
  input.value = v;
  validateAll();
}

function onCellKeyDown(e){
  const input = e.target;
  const id = input.id;
  const [_, rStr, cStr] = id.split('-');
  const r = Number(rStr), c = Number(cStr);
  if(e.key >= '1' && e.key <= '9'){
    setTimeout(validateAll, 0);
    selectCell(r,c);
    return;
  }
  if(e.key === 'Backspace' || e.key === 'Delete' || e.key === '0'){
    input.value = '';
    validateAll();
    e.preventDefault();
    return;
  }
  // Arrow navigation
  if(e.key === 'ArrowUp') { moveSelection(r-1,c); e.preventDefault(); }
  if(e.key === 'ArrowDown') { moveSelection(r+1,c); e.preventDefault(); }
  if(e.key === 'ArrowLeft') { moveSelection(r,c-1); e.preventDefault(); }
  if(e.key === 'ArrowRight') { moveSelection(r,c+1); e.preventDefault(); }
}

function moveSelection(r,c){
  if(r<0||r>8||c<0||c>8) return;
  const inp = document.getElementById(`cell-${r}-${c}`);
  if(inp){ inp.focus(); }
}

function selectCell(r,c){
  const prev = sudokuEl.querySelector('.cell.selected');
  if(prev) prev.classList.remove('selected');
  const cell = getCellEl(r,c);
  if(cell){ cell.classList.add('selected'); selectedCell = {r,c}; }
}

function getCellEl(r,c){
  return sudokuEl.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
}

function getInputValue(r,c){
  const cell = getCellEl(r,c);
  if(!cell) return null;
  const inp = cell.querySelector('input');
  return inp ? (inp.value ? Number(inp.value) : 0) : puzzle[r][c] || 0;
}

function validateAll(){

  sudokuEl.querySelectorAll('.cell').forEach(el=>el.classList.remove('error'));


  function markDuplicates(positions){
    const map = {};
    positions.forEach(([r,c])=>{
      const v = getInputValue(r,c);
      if(!v) return;
      const key = v;
      if(!map[key]) map[key] = [];
      map[key].push([r,c]);
    });
    Object.values(map).forEach(list=>{
      if(list.length>1){
        list.forEach(([r,c])=>{
          const cell = getCellEl(r,c);
          if(cell) cell.classList.add('error');
        });
      }
    });
  }

  // rows
  for(let r=0;r<9;r++){
    const pos = [];
    for(let c=0;c<9;c++) pos.push([r,c]);
    markDuplicates(pos);
  }
  // cols
  for(let c=0;c<9;c++){
    const pos = [];
    for(let r=0;r<9;r++) pos.push([r,c]);
    markDuplicates(pos);
  }
  // boxes
  for(let br=0;br<3;br++){
    for(let bc=0;bc<3;bc++){
      const pos = [];
      for(let r=br*3;r<br*3+3;r++){
        for(let c=bc*3;c<bc*3+3;c++) pos.push([r,c]);
      }
      markDuplicates(pos);
    }
  }
}

// --------------------
// Solver & Generator
// --------------------

function shuffleArray(arr){
  for(let i = arr.length - 1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isSafe(grid, r, c, n){
  for(let i=0;i<9;i++){
    if(grid[r][i] === n) return false;
    if(grid[i][c] === n) return false;
  }
  const br = Math.floor(r/3)*3;
  const bc = Math.floor(c/3)*3;
  for(let i=br;i<br+3;i++) for(let j=bc;j<bc+3;j++) if(grid[i][j]===n) return false;
  return true;
}


function countSolutions(grid, limit=2){
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(grid[r][c] === 0){
        let count = 0;
        for(let n=1;n<=9;n++){
          if(isSafe(grid,r,c,n)){
            grid[r][c] = n;
            const res = countSolutions(grid, limit);
            if(res>0) count += res;
            grid[r][c] = 0;
            if(count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}


function generateFullSolution(){
  const grid = createEmptyGrid();
  const cells = [];
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) cells.push([r,c]);
  function backtrack(idx){
    if(idx >= cells.length) return true;
    const [r,c] = cells[idx];
    const nums = [1,2,3,4,5,6,7,8,9];
    shuffleArray(nums);
    for(const n of nums){
      if(isSafe(grid,r,c,n)){
        grid[r][c] = n;
        if(backtrack(idx+1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }
  backtrack(0);
  return grid;
}


function generatePuzzleFromSolution(fullSol, options={clues:30, minPerBlock:3}){
  const g = fullSol.map(r=>r.slice());
  const cells = [];
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) cells.push([r,c]);
  shuffleArray(cells);


  const targetFilled = Math.max(17, Math.min(81, options.clues || 30));
  const minPerBlock = (typeof options.minPerBlock === 'number') ? options.minPerBlock : 3;


  const blockCounts = new Array(9).fill(0);
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    const b = Math.floor(r/3)*3 + Math.floor(c/3);
    if(g[r][c] !== 0) blockCounts[b]++;
  }

  for(const [r,c] of cells){
    const b = Math.floor(r/3)*3 + Math.floor(c/3);
    if(blockCounts[b] <= minPerBlock) continue;

    const backup = g[r][c];
    g[r][c] = 0;
    const copy = g.map(row=>row.slice());
    const sols = countSolutions(copy, 2);
    if(sols !== 1){
      g[r][c] = backup;
    } else {
      blockCounts[b]--;
      const filled = g.flat().filter(x=>x!==0).length;
      if(filled <= targetFilled) break;
    }
  }
  return g;
}

function generateNewPuzzle(options={clues:30, minPerBlock:3}){
  statusEl.textContent = 'Generating puzzle...';
  const full = generateFullSolution();
  const puzzleGrid = generatePuzzleFromSolution(full, options);
  puzzle = puzzleGrid;
  solution = full;
  renderGrid();
  validateAll();
  statusEl.textContent = '';
}


document.getElementById('hint').addEventListener('click', ()=>{

  const empties = [];
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    if(puzzle[r][c]===0){
      const val = getInputValue(r,c);
      if(!val) empties.push([r,c]);
    }
  }
  if(empties.length===0){ statusEl.textContent = 'No empty cells to hint.'; return; }
  const [r,c] = empties[Math.floor(Math.random()*empties.length)];
  const inp = document.getElementById(`cell-${r}-${c}`);
  if(inp){ inp.value = solution[r][c]; inp.focus(); selectCell(r,c); validateAll(); statusEl.textContent = `Hint: filled row ${r+1} col ${c+1}.`; }
});

document.getElementById('reset').addEventListener('click', ()=>{

  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    const cell = getCellEl(r,c);
    if(!cell) continue;
    const inp = cell.querySelector('input');
    if(inp) inp.value = '';
  }
  statusEl.textContent = '';
  validateAll();
});

document.getElementById('check').addEventListener('click', ()=>{
  let wrong = 0, empty = 0;
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    const val = getInputValue(r,c);
    if(!val) empty++;
    else if(val !== solution[r][c]) wrong++;
  }
  if(empty>0) statusEl.textContent = `Not complete — ${empty} empty cell(s).`;
  else if(wrong>0) statusEl.textContent = `Some numbers are incorrect — ${wrong} mismatches.`;
  else statusEl.textContent = 'Congratulations — puzzle solved correctly!';
});


document.addEventListener('keydown', (e)=>{
  const active = document.activeElement;
  const focusIsInput = active && active.tagName === 'INPUT';
  if(focusIsInput) return;
  if(!selectedCell) return;
  if(e.key >= '1' && e.key <= '9'){
    const inp = document.getElementById(`cell-${selectedCell.r}-${selectedCell.c}`);
    if(inp){ inp.value = e.key; validateAll(); inp.focus(); }
  }
  if(e.key === 'Backspace' || e.key === 'Delete' || e.key==='0'){
    const inp = document.getElementById(`cell-${selectedCell.r}-${selectedCell.c}`);
    if(inp){ inp.value = ''; validateAll(); inp.focus(); }
  }
});

// New puzzle button
const newBtn = document.getElementById('new');
if(newBtn) newBtn.addEventListener('click', ()=>{
  const diffEl = document.getElementById('difficulty');
  const diff = diffEl ? diffEl.value : 'medium';
  const map = {
    easy: {clues:36, minPerBlock:4},
    medium: {clues:30, minPerBlock:3},
    hard: {clues:24, minPerBlock:2}
  };
  const opts = map[diff] || map.medium;
  generateNewPuzzle({clues:opts.clues, minPerBlock:opts.minPerBlock});
}
);

// Initialization: generate a puzzle on load using the default difficulty selector
const initialDiffEl = document.getElementById('difficulty');
const initialDiff = initialDiffEl ? initialDiffEl.value : 'medium';
const initialMap = { easy: {clues:36, minPerBlock:4}, medium: {clues:30, minPerBlock:3}, hard: {clues:24, minPerBlock:2} };
const initialOpts = initialMap[initialDiff] || initialMap.medium;
generateNewPuzzle({clues:initialOpts.clues, minPerBlock:initialOpts.minPerBlock});
