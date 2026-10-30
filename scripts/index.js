import { notify, isInside } from './misc.js'
import { createDraggable, random, round } from 'animejs';

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

        if (inARow>=3) {
          const plusCash = round(totalCash * inARow/10, 2)
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

        loot.classList.remove('loot-unpacked')
        loot.classList.add('loot-packed')

        const lootRect = loot.getBoundingClientRect()
        const placeRect = boxPlace.getBoundingClientRect()
        const offsetX = placeRect.left + placeRect.width / 2 - (lootRect.left + lootRect.width / 2)
        const offsetY = placeRect.top + placeRect.height / 2 - (lootRect.top + lootRect.height / 2)

        self.setX(self.x + offsetX)
        self.setY(self.y + offsetY)
        self.disable()
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

const SVG = `
<svg width="128" height="128" viewBox="0 0 24 24" fill="#2d3a8f" xmlns="http://www.w3.org/2000/svg">
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

    levelInfo.Func()
    addCash(-Cost)
    
    currentLevel += 1

    const newPrice = levels[currentLevel] && levels[currentLevel].Cost

    amount.textContent = `${currentLevel}/${levels.length}`
    price.textContent = newPrice && `$${newPrice}` || 'Maxed'
  })

  return card;
}

// Upgrade functions

const addOneTenthLuck = () => {
  Luck += .1
}

const addOneBoxLimit = () => {
  Boxes_limit += 1
}

const addOneSpaceInBox = () => {
  Max_loot_per_box += 1
}

// 100 = 128px (one upgrade size)

createUpgrade('Loot luck', [
  {Cost: 40, Func: addOneTenthLuck},
  {Cost: 60, Func: addOneTenthLuck},
  {Cost: 80, Func: addOneTenthLuck},
  {Cost: 100, Func: addOneTenthLuck},
], 0, 0)

createUpgrade('Loot luck', [
  {Cost: 40, Func: addOneTenthLuck},
  {Cost: 60, Func: addOneTenthLuck},
  {Cost: 80, Func: addOneTenthLuck},
  {Cost: 100, Func: addOneTenthLuck},
], 0, 120)

createUpgrade('Boxes limit +1', [
  {Cost: 20, Func: addOneBoxLimit},
  {Cost: 40, Func: addOneBoxLimit},
], -120, 120)

createUpgrade('Box space +1', [
  {Cost: 20, Func: addOneSpaceInBox},
  {Cost: 40, Func: addOneSpaceInBox},
], -180, 220)

console.log('main.js loaded')