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
let Cash_multi = 1

const addCash = (amount) => {
  Cash += amount
  Cash = round(Cash, 2)
  cashLabel.textContent = `Cash: ${Cash}`
}

// Box shop

let Equipped_box = 'box'
let Boxes_owned = ['box']
const Box_types = {
  'box': { Name: 'Default box', Cost: 0, Multi: 1 },
  'marked-box': { Name: 'Marked box', Cost: 300, Multi: 2 },
  'white-box': { Name: 'White box', Cost: 1600, Multi: 10 },
}

const boxShop = document.getElementById('box-shop')
const boxShopButton = document.getElementById('box-shop-button')
const topRowPicker = document.getElementById('top-row-picker')

for (const type in Box_types) {
  const boxInfo = Box_types[type]
  const card = document.createElement("div");
  card.innerHTML = `
    <p>${boxInfo.Name}</p>
    <img draggable=false src='assets/${type}-opened.png'></img>
    <button>${type == 'box' && 'Equipped' || '$' + boxInfo.Cost}</button>
  `;
  card.id = type+'SHOP'
  boxShop.append(card)

  const button = card.querySelector('button')
  button.addEventListener('click', () => {
    if (Equipped_box == type) {
      return
    }

    if (Boxes_owned.includes(type)) {
      document.getElementById(Equipped_box+'SHOP').querySelector('button').textContent = 'Equip'
      button.textContent = 'Equipped'
      Equipped_box = type
      return
    }

    const Cost = boxInfo.Cost

    if (Cash < Cost) {
      notify('Not enough cash')
      return
    }

    addCash(-Cost)
    Boxes_owned.push(type)
    button.textContent = 'Equip'
  })
}

boxShopButton.addEventListener('click', () => {
  boxShop.style.display='flex'
})

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
  box.id = Equipped_box
  box.src = `assets/${box.id}-opened.png`
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

        Box_loot.forEach(function (loot) {
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

        totalCash *= Cash_multi
        totalCash *= Box_types[box.id].Multi

        if (inARow >= 3) {
          const plusCash = round(totalCash * inARow / 10 * Cash_multi, 2)
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
    box.src = `assets/${box.id}-closed.png`
    Box_placed.enable()
    Box_placed = null
    packBox.disabled = true

    Loot_in_box.forEach(function (loot) {
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
  { Name: 'labubu', Chance: 100, Cost: 5 },
  { Name: 'spinner', Chance: 90, Cost: 7 },
  { Name: 'inverted-labubu', Chance: 50, Cost: 50 }
]

// luck = 2 = all things have the same chance
const getRandomLoot = (howLucky = 1) => {
  const maxChance = Math.max(...Loots.map(l => l.Chance));

  const weights = Loots.map(l => l.Chance * (maxChance / l.Chance) ** (howLucky - 1));
  const total = weights.reduce((a, b) => a + b, 0);

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

        loot.style.transform += ` rotate(${random(1, 360)}deg)`
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

const Upgrades_bought = {}

const primaryNotBought = '#555555'
const secondaryNotBought = '#666666'

const primaryBought = "#2d3a8f"
const secondaryBought = "#242c65"

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG = `
<svg width="128" height="128" viewBox="1 1 22 22" fill=${primaryNotBought} xmlns=${SVG_NS}>
  <path d="M11.2346 2.31703C11.7247 2.11404 12.2753 2.11404 12.7654 2.31703L18.3057 4.61191C18.7958 4.81489 19.1851 5.20424 19.3881 5.6943L21.683 11.2346C21.886 11.7247 21.886 12.2753 21.683 12.7654L19.3881 18.3057C19.1851 18.7958 18.7958 19.1851 18.3057 19.3881L12.7654 21.683C12.2753 21.886 11.7247 21.886 11.2346 21.683L5.6943 19.3881C5.20424 19.1851 4.81489 18.7958 4.61191 18.3057L2.31703 12.7654C2.11404 12.2753 2.11404 11.7247 2.31703 11.2346L4.61191 5.6943C4.81489 5.20424 5.20424 4.81489 5.6943 4.61191L11.2346 2.31703Z" 
  stroke=${secondaryNotBought}  stroke-width="2"/>
</svg>`;

const below = document.getElementById('below')
const lines = document.getElementById('lines')

const hasReqs = (id) => {
  const upg = Upgrades[id]

  let reqsMet = true
  let reason = ''

  upg.Requirements.forEach(function (reqId) {
    if (!reqsMet) {
      return
    }

    if (!Upgrades_bought[reqId]) {
      reqsMet = false
      reason = Upgrades[reqId].Label
    }
  })

  return [reqsMet, reason]
}

const createCard = (id) => {
  const upg = Upgrades[id]

  let currentLevel = 0;

  const levels = upg.Levels
  const name = upg.Label

  const card = document.createElement("div");
  card.className = "upgrade-default";
  card.id = name
  card.innerHTML = `
    ${SVG}
    <button></button>
    <p class="amount">${currentLevel}/${levels.length}</p>
    <p class="label">${name}</p>
    <p class="price">$${levels[currentLevel].Cost}</p>
  `;
  card.style.transform = `translate(${upg.X}%, ${upg.Y}%)`;
  below.appendChild(card);

  const button = card.querySelector('button')
  const amount = card.querySelector('.amount')
  const price = card.querySelector('.price')

  button.addEventListener('click', () => {
    if (currentLevel >= levels.length) {
      notify('Max level reached')
      return
    }

    const [requirementsMet, whichDoesnt] = hasReqs(id)
    if (!requirementsMet) {
      notify(`Need ${whichDoesnt}`)
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
    Upgrades_bought[id] = currentLevel

    if (currentLevel == 1) {
      upg.Lines.forEach(function (path) {
        animate(path, { stroke: { to: primaryBought, duration: 550 } })
      })

      const upgsUnlocks = upg.Unlocks
      upgsUnlocks.forEach(function (unlockedId) {
        const [metReqs] = hasReqs(unlockedId)
        if (metReqs) {
          const svg = Upgrades[unlockedId].Card.querySelector('svg')
          animate(svg, { fill: { to: primaryBought, duration: 330 } })
          animate(svg.querySelector('path'), { stroke: { to: secondaryBought, duration: 390 } })
        }
      })
    }

    amount.textContent = `${currentLevel}/${levels.length}`

    const newPrice = levels[currentLevel] && levels[currentLevel].Cost
    if (newPrice) {
      price.textContent = `$${newPrice}`
    } else {
      price.textContent = 'Maxed'

      const { chars } = splitText(price, { words: false, chars: true });

      animate(chars, {
        y: [
          { to: '-1.1rem', ease: 'outExpo', duration: 600 },
          { to: 0, ease: 'outBounce', duration: 800, delay: 100 }
        ],
        rotate: { from: '-1turn', delay: 0 },
        color: { to: 'rgb(110, 158, 220)', ease: 'inExpo', duration: 550 },
        delay: stagger(50),
        ease: 'inOutCirc',
        loop: false
      });
    }
  })

  return card;
}

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
  path.setAttribute("stroke", secondaryNotBought);
  path.setAttribute("stroke-width", WIDTH);
  path.setAttribute("stroke-linecap", "round");
  lines.appendChild(path);

  return path;
}

// 100 = 128px (one upgrade size)

const Upgrades = {
  'M1': {
    Label: 'Cash multi +0.1x',
    Levels:
      [
        { Cost: 25, Func: () => Cash_multi += 0.1 },
        { Cost: 45, Func: () => Cash_multi += 0.1 },
        { Cost: 70, Func: () => Cash_multi += 0.1 },
        { Cost: 95, Func: () => Cash_multi += 0.1 },
      ],
    X: 0, Y: 0,
    Requirements: []
  },

  'M2': {
    Label: 'Loot luck',
    Levels:
      [
        { Cost: 30, Func: () => Luck += 0.1 },
        { Cost: 45, Func: () => Luck += 0.1 },
        { Cost: 60, Func: () => Luck += 0.1 },
        { Cost: 75, Func: () => Luck += 0.1 },
        { Cost: 90, Func: () => Luck += 0.1 },
      ],
    X: 0, Y: 110,
    Requirements: ['M1']
  },

  'L2': {
    Label: 'Boxes limit +1',
    Levels:
      [
        { Cost: 20, Func: () => Boxes_limit += 1 },
        { Cost: 40, Func: () => Boxes_limit += 1 },
      ],
    X: -130, Y: 125,
    Requirements: ['M2']
  },

  'L3': {
    Label: 'Box space +1',
    Levels:
      [
        { Cost: 20, Func: () => Max_loot_per_box += 1 },
        { Cost: 40, Func: () => Max_loot_per_box += 1 },
      ],
    X: -150, Y: 250,
    Requirements: ['L2']
  },

  'R2': {
    Label: 'Loot limit +1',
    Levels: [
      { Cost: 35, Func: () => Loot_limit += 1 },
      { Cost: 50, Func: () => Loot_limit += 1 },
      { Cost: 75, Func: () => Loot_limit += 1 },
    ],
    X: 125, Y: 125,
    Requirements: ['M2']
  },

  'M3': {
    Label: 'Cash multi +0.15x',
    Levels: [
      { Cost: 50, Func: () => Cash_multi += 0.15 },
      { Cost: 80, Func: () => Cash_multi += 0.15 },
      { Cost: 100, Func: () => Cash_multi += 0.15 },
      { Cost: 110, Func: () => Cash_multi += 0.15 },
    ],
    X: 10, Y: 240,
    Requirements: ['M2']
  },

  'M4': {
    Label: 'Unlock box shop',
    Levels: [{
      Cost: 500, Func: () => {
        topRowPicker.style.display='block'
        boxShopButton.style.display='block'
      }
    }],
    X: 70, Y: 380,
    Requirements: ['L3', 'M3', 'R2']
  },
}

// add unlocks

for (const id in Upgrades) {
  Upgrades[id].Unlocks = []
}

for (const id in Upgrades) {
  const upg = Upgrades[id]
  upg.Requirements.forEach(function (reqId) {
    Upgrades[reqId].Unlocks.push(id)
  })
}

// create cards

for (const id in Upgrades) {
  const upg = Upgrades[id]
  upg['Card'] = createCard(id)
  upg['Lines'] = []

  if (!upg.Requirements.length) {
    const svg = upg.Card.querySelector('svg')
    svg.style.fill = primaryBought
    svg.querySelector('path').style.stroke = secondaryBought
  }
}

// create lines

for (const id in Upgrades) {
  const upg = Upgrades[id]
  const card = upg.Card
  upg.Unlocks.forEach(function (otherId) {
    const otherCard = Upgrades[otherId].Card
    const path = connect(card, otherCard)
    upg.Lines.push(path)
  })
}

console.log('main.js loaded')

addCash(0)