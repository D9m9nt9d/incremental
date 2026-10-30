import { notify, isInside } from './misc.js'
import { createDraggable, random, round } from 'animejs';
import { animate, splitText, stagger } from 'animejs';

console.log('main.js loading')

// let Id = 1
// const getId = () => {
//   if (Id > 1024) {
//     Id = 0
//   }
//   Id += 1
//   return Id
// }

// Cash

const cashLabel = document.getElementById('cash-label')

let Cash = 0
let CashMulti = 1

const addCash = (amount) => {
  Cash += amount
  Cash = round(Cash, 2)
  cashLabel.textContent = `Cash: ${Cash}`
}

// Boxes

let Packed_boxes = {}

let Boxes_limit = 3
let Boxes_count = 0

const above = document.getElementById('above')
const boxCounter = document.getElementById('boxes-counter')
const makeBox = document.getElementById('make-box')
const packBox = document.getElementById('pack-box')
const boxesContainer = document.getElementById('boxes-container')
const boxPlace = document.getElementById('box-place')
const dropoffArea = document.getElementById('dropoff-area')

let Box_placed = null
packBox.disabled = true

const removeBox = (box) => {
  box.remove()
  Boxes_count = Boxes_count - 1
  boxCounter.textContent = Boxes_count
}

const addBox = () => {
  Boxes_count = Boxes_count + 1
  boxCounter.textContent = Boxes_count

  const box = document.createElement('img')
  box.draggable = false
  box.src = 'assets/box-opened.png'
  box.classList.add('box-unpacked')
  boxesContainer.appendChild(box)

  createDraggable(box, {
    container: above,
    containerFriction: 1,
    velocityMultiplier: 0,

    onRelease: (self) => {
      if (box.classList.contains('box-packed')) {
        if (!isInside(box, dropoffArea)) {
          return
        }

        removeBox(box)

        const Box_loot = Packed_boxes[box]

        let lastName = null
        let inARow = 1
        let totalCash = 0

        Box_loot.forEach(function(loot) {
          totalCash += loot.Cost

          if (lastName != null) {
            if (lastName == loot.Name) {
              inARow += 1
            } else {
              inARow = 1
            }
          }
          lastName = loot.Name
        })
        Packed_boxes[box] = null

        totalCash *= CashMulti

        if (inARow>=3) {
          const plusCash = round(totalCash * inARow/10 * CashMulti, 2)
          totalCash = totalCash + plusCash
          notify(`${inARow} ${lastName}s in a row! +${plusCash}`)
        }

        addCash(totalCash)

        return
      }

      if (Box_placed == null && isInside(box, boxPlace)) {
        Box_placed = self
        packBox.disabled = false
        
        const boxRect = box.getBoundingClientRect()
        const placeRect = boxPlace.getBoundingClientRect()
        const offsetX = placeRect.left + placeRect.width / 2 - (boxRect.left + boxRect.width / 2)
        const offsetY = placeRect.top + placeRect.height / 2 - (boxRect.top + boxRect.height / 2)

        self.setX(self.x + offsetX)
        self.setY(self.y + offsetY)
        self.disable()
      }
    }
  })
}

packBox.addEventListener('click', () => {
  if (Box_placed != null) {
    const box = Box_placed.$target
    box.classList.remove('box-unpacked')
    box.classList.add('box-packed')
    box.src = 'assets/box-closed.png'
    Box_placed.enable()
    Box_placed = null
    packBox.disabled = true

    Loot_in_box.forEach(function(loot) {
      removeLoot(loot.element)
      loot.element = null
    })
    Packed_boxes[box] = Loot_in_box
    Loot_in_box = []
  }
})

makeBox.addEventListener('click', () => {
  if (Boxes_count < Boxes_limit) {
    addBox()
  } else {
    notify('Boxes limit reached')
  } 
})

// Loot

const Loots = [
  {Name: 'Labubu', Chance: 100, Cost: 5},
  {Name: 'Spinner', Chance: 90, Cost: 7},
  {Name: 'Inverted-labubu', Chance: 50, Cost: 50}
]

// luck = 2 = all things have the same chance
const getRandomLoot = (howLucky = 1)  =>{
  const maxChance = Math.max(...Loots.map(l => l.Chance));

  const weights = Loots.map(l => l.Chance * (maxChance / l.Chance) ** (howLucky - 1));
  const total = weights.reduce((a, b) => a + b, 0);

  console.log(weights)

  let roll = Math.random() * total;
  for (let i = 0; i < Loots.length; i++) {
    roll -= weights[i];
    if (roll < 0) return { ...Loots[i] };
  }
  return { ...Loots[Loots.length - 1] };
}

let Loot_limit = 7
let Loot_count = 0

let Max_loot_per_box = 3
let Loot_in_box = []

let Luck = 1

const lootCounter = document.getElementById('loot-counter')
const makeLoot = document.getElementById('make-loot')
const lootContainer = document.getElementById('loot-container')

const removeLoot = (loot) => {
  loot.remove()
  Loot_count = Loot_count - 1
  lootCounter.textContent = Loot_count
}

const addLoot = () => {
  Loot_count = Loot_count + 1
  lootCounter.textContent = Loot_count

  const randomLoot = getRandomLoot(Luck)

  const loot = document.createElement('img')
  loot.draggable = false
  loot.src = `assets/loot/${randomLoot.Name}.png`
  loot.classList.add('loot-unpacked')
  lootContainer.appendChild(loot)

  randomLoot['element'] = loot

  const draggable = createDraggable(loot, {
    container: above,
    containerFriction: 1,
    velocityMultiplier: 0,

    onRelease: (self) => {
      if (Box_placed != null && isInside(loot, boxPlace)) {
        if (Loot_in_box.length >= Max_loot_per_box) {
          notify('No more space in that box')
          return
        }

        Loot_in_box.push(randomLoot)

        self.revert()
        
        loot.classList.remove('loot-unpacked')
        loot.classList.add('loot-packed')

        loot.style.transform += ` rotate(${random(1,360)}deg)`
        boxPlace.append(loot)
      }
    }
  })

  const containerRect = lootContainer.getBoundingClientRect()
  const lootRect = loot.getBoundingClientRect()

  const maxX = containerRect.width - lootRect.width
  const maxY = containerRect.height - lootRect.height

  const randomX = Math.random() * Math.max(0, maxX)
  const randomY = Math.random() * Math.max(0, maxY)

  draggable.setX(randomX)
  draggable.setY(randomY)
}

makeLoot.addEventListener('click', () => {
  if (Loot_count < Loot_limit) {
    addLoot()
  } else {
    notify('Loot limit reached')
  }
})

// Upgrades

const SVG_NS = "http://www.w3.org/2000/svg";

const SVG = `
<svg width="128" height="128" viewBox="1 1 22 22" fill="#2d3a8f" xmlns=${SVG_NS}>
  <path d="M11.2346 2.31703C11.7247 2.11404 12.2753 2.11404 12.7654 2.31703L18.3057 4.61191C18.7958 4.81489 19.1851 5.20424 19.3881 5.6943L21.683 11.2346C21.886 11.7247 21.886 12.2753 21.683 12.7654L19.3881 18.3057C19.1851 18.7958 18.7958 19.1851 18.3057 19.3881L12.7654 21.683C12.2753 21.886 11.7247 21.886 11.2346 21.683L5.6943 19.3881C5.20424 19.1851 4.81489 18.7958 4.61191 18.3057L2.31703 12.7654C2.11404 12.2753 2.11404 11.7247 2.31703 11.2346L4.61191 5.6943C4.81489 5.20424 5.20424 4.81489 5.6943 4.61191L11.2346 2.31703Z" stroke="#242c65" stroke-width="2"/>
</svg>`;

const below = document.getElementById('below')

const createUpgrade = (name, levels, x, y) => {
  let currentLevel = 0;

  const card = document.createElement("div");
  card.className = "upgrade-default";
  card.innerHTML = `
    ${SVG}
    <button></button>
    <p class="amount">${currentLevel}/${levels.length}</p>
    <p class="label">${name}</p>
    <p class="price">$${levels[currentLevel].Cost}</p>
  `;
  card.style.transform = `translate(${x}%, ${y}%)`;
  below.appendChild(card);

  const button = card.querySelector('button')
  const amount = card.querySelector('.amount')
  const price = card.querySelector('.price')

  button.addEventListener('click', () => {
    if (currentLevel>=levels.length) {
      notify('Max level reached')
      return
    }

    const levelInfo = levels[currentLevel]
    const Cost = levelInfo.Cost

    if (Cash < Cost) {
      notify('Not enough cash')
      return
    }

    levelInfo.Func(levelInfo.Argument)
    addCash(-Cost)
    
    currentLevel += 1

    amount.textContent = `${currentLevel}/${levels.length}`

    const newPrice = levels[currentLevel] && levels[currentLevel].Cost
    if (newPrice) {
      price.textContent = `$${newPrice}`
    } else {
      price.textContent = 'Maxed'

      const { chars } = splitText(price, { words: false, chars: true });

      animate(chars, {
        // Property keyframes
        y: [
          { to: '-1.1rem', ease: 'outExpo', duration: 600 },
          { to: 0, ease: 'outBounce', duration: 800, delay: 100 }
        ],
        // Property specific parameters
        rotate: {
          from: '-1turn',
          delay: 0
        },
        color: {
          to: 'rgb(110, 158, 220)', ease: 'inExpo', duration: 550,
        },
        delay: stagger(50),
        ease: 'inOutCirc',
        loop: false
      });
    }
  })

  return card;
}

const lines = document.getElementById('lines')

const TENSION = 0.3; // higher = wigglier
const WIDTH = 8;

const connect = (a, b) => {
  const box = below.getBoundingClientRect();
  const ra = a.querySelector('svg').getBoundingClientRect();
  const rb = b.querySelector('svg').getBoundingClientRect();

  const ac = { x: ra.left + ra.width / 2, y: ra.top + ra.height / 2 };
  const bc = { x: rb.left + rb.width / 2, y: rb.top + rb.height / 2 };
  const horizontal = Math.abs(bc.x - ac.x) > Math.abs(bc.y - ac.y);

  let x1, y1, x2, y2, c1, c2;

  if (horizontal) {
    const aFirst = ac.x < bc.x;
    x1 = (aFirst ? ra.right : ra.left) - box.left;
    y1 = ac.y - box.top;
    x2 = (aFirst ? rb.left : rb.right) - box.left;
    y2 = bc.y - box.top;
    const dx = Math.abs(x2 - x1) * TENSION * (aFirst ? 1 : -1);
    c1 = `${x1 + dx} ${y1}`;
    c2 = `${x2 - dx} ${y2}`;
  } else {
    const aFirst = ac.y < bc.y;
    x1 = ac.x - box.left;
    y1 = (aFirst ? ra.bottom : ra.top) - box.top;
    x2 = bc.x - box.left;
    y2 = (aFirst ? rb.top : rb.bottom) - box.top;
    const dy = Math.abs(y2 - y1) * TENSION * (aFirst ? 1 : -1);
    c1 = `${x1} ${y1 + dy}`;
    c2 = `${x2} ${y2 - dy}`;
  }

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", `M ${x1} ${y1} C ${c1}, ${c2}, ${x2} ${y2}`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#2d3a8f");
  path.setAttribute("stroke-width", WIDTH);
  path.setAttribute("stroke-linecap", "round");
  lines.appendChild(path);
  return path;
}

// Upgrade functions

const addLuck = (argument) => {
  Luck += argument
}

const addBoxLimit = (argument) => {
  Boxes_limit += argument
}

const addBoxSpace = (argument) => {
  Max_loot_per_box += argument
}

const addLootLimit = (argument) => {
  Loot_limit += argument
}

const addCashMulti = (argument) => {
  CashMulti += argument
}

// 100 = 128px (one upgrade size)

const cashMulti1 = createUpgrade('Cash multi +0.1x', [
  {Cost: 25, Func: addCashMulti, Argument: 0.1},
  {Cost: 45, Func: addCashMulti, Argument: 0.1},
  {Cost: 70, Func: addCashMulti, Argument: 0.1},
  {Cost: 95, Func: addCashMulti, Argument: 0.1},
], 0, 0)

const lootLuck1 = createUpgrade('Loot luck', [
  {Cost: 30, Func: addLuck, Argument: 0.1},
  {Cost: 45, Func: addLuck, Argument: 0.1},
  {Cost: 60, Func: addLuck, Argument: 0.1},
  {Cost: 75, Func: addLuck, Argument: 0.1},
  {Cost: 90, Func: addLuck, Argument: 0.1},
], 0, 110)

connect(cashMulti1, lootLuck1)

const boxesLimit1 = createUpgrade('Boxes limit +1', [
  {Cost: 20, Func: addBoxLimit, Argument: 1},
  {Cost: 40, Func: addBoxLimit, Argument: 1},
], -130, 125)

connect(lootLuck1, boxesLimit1)

const boxSpace1 = createUpgrade('Box space +1', [
  {Cost: 20, Func: () => Max_loot_per_box += 1 , Argument: 1},
  {Cost: 40, Func: addBoxSpace, Argument: 1},
], -150, 250)

connect(boxesLimit1, boxSpace1)

const cashMulti2 = createUpgrade('Cash multi +0.1x', [
  {Cost: 50, Func: addCashMulti, Argument: 0.1},
  {Cost: 80, Func: addCashMulti, Argument: 0.1},
  {Cost: 100, Func: addCashMulti, Argument: 0.1},
  {Cost: 110, Func: addCashMulti, Argument: 0.1},
], 10, 240)

connect(lootLuck1, cashMulti2)

const lootLimit1 = createUpgrade('Loot limit +1', [
  {Cost: 35, Func: addLootLimit, Argument: 1},
  {Cost: 50, Func: addLootLimit, Argument: 1},
  {Cost: 75, Func: addLootLimit, Argument: 1},
], 125, 125)

connect(lootLuck1, lootLimit1)

console.log('main.js loaded')