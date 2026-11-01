import { notify, isInside, formatCash } from './misc.js'
import { createDraggable, random, round } from 'animejs';
import { animate, splitText, stagger } from 'animejs';

console.log('main.js loading')

// Cash

const cashLabel = document.getElementById('cash-label')

let Cash = 0
let Cash_multi = 1

let Actual_cash_multi = 1

const addCash = (amount) => {
  Cash += amount
  Cash = round(Cash, 2)
  cashLabel.textContent = `Cash: ${formatCash(Cash)}`
  localStorage.setItem('cash', Cash)
}

// Prestiges

const belower = document.getElementById('belower')
const prestigesLabel = document.getElementById('prestiges-label')

let Prestiges = 0
let Prestiges_multi = 1

const addPrestiges = (amount) => {
  Prestiges += amount
  Prestiges = round(Prestiges, 2)
  prestigesLabel.textContent = `Prestiges: ${Prestiges}`
  localStorage.setItem('prestiges', Prestiges)

  if (Prestiges > 0) {
    prestigesLabel.style.display = 'block'
    belower.style.display = 'flex'
  }
}

// Top row picker stuff

const topRowPicker = document.getElementById('top-row-picker')

let Equipped_box = 'box'
let Boxes_owned = ['box']
const Box_types = {
  'box': { Name: 'Default box', Cost: 0, Multi: 1 },
  'marked-box': { Name: 'Marked box', Cost: 300, Multi: 2 },
  'white-box': { Name: 'White box', Cost: 1600, Multi: 5 },
  'crate': { Name: 'Crate', Cost: 10000, Multi: 20 },
}

const boxShop = document.getElementById('box-shop')
const boxShopButton = document.getElementById('box-shop-button')

for (const type in Box_types) {
  const boxInfo = Box_types[type]
  const card = document.createElement("div");
  card.innerHTML = `
    <p>${boxInfo.Name}</p>
    <img draggable=false src='assets/${type}-opened.png'></img>
    <button>${type == 'box' && 'Equipped' || '$' + boxInfo.Cost}</button>
  `;
  card.id = type + 'SHOP'
  boxShop.append(card)

  const button = card.querySelector('button')
  button.addEventListener('click', () => {
    if (Equipped_box == type) {
      return
    }

    if (Boxes_owned.includes(type)) {
      document.getElementById(Equipped_box + 'SHOP').querySelector('button').textContent = 'Equip'
      button.textContent = 'Equipped'
      Equipped_box = type
      localStorage.setItem('equippedBox', Equipped_box)
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

    localStorage.setItem('boxes', JSON.stringify(Boxes_owned))
  })
}

const statsPage = document.getElementById('stats-page')
const statsPageButton = document.getElementById('stats-page-button')

const createStat = () => {
  const element = document.createElement('p')
  statsPage.append(element)
  return element
}

const lootLuckStat = createStat()
const lootLimitStat = createStat()
const boxesLimitStat = createStat()
const maxLootPerBoxStat = createStat()
const boxMultiplier = createStat()
const cashMultiplier = createStat()
const totalCashMulti = createStat()
const upgradesBought = createStat()
const glowingLootChance = createStat()
const glowingLootMultiplier = createStat()
const invertedLootChance = createStat()
const invertedLootMultiplier = createStat()

setInterval(() => {
  lootLuckStat.textContent = `Loot luck: ${round(Luck, 2)}`
  lootLimitStat.textContent = `Loot limit: ${round(Loot_limit, 2)}`
  boxesLimitStat.textContent = `Boxes limit: ${round(Boxes_limit, 2)}`
  maxLootPerBoxStat.textContent = `Max loot per box: ${round(Max_loot_per_box, 2)}`
  const boxMulti = Box_types[Equipped_box].Multi
  boxMultiplier.textContent = `Box multiplier: ${boxMulti}`
  const cashMulti = round(Cash_multi, 2)
  cashMultiplier.textContent = `Cash multiplier: ${cashMulti}`
  totalCashMulti.textContent = `Total cash multiplier: ${boxMulti * cashMulti}`
  upgradesBought.textContent = `Upgrades bought: ${Object.keys(Upgrades_bought).length}`
  glowingLootChance.textContent = `Glowing loot chance: ${round(Glowing_loot_chance, 2)}%`
  glowingLootMultiplier.textContent = `Glowing loot multiplier: ${round(Glowing_loot_multiplier, 2)}`
  invertedLootChance.textContent = `Inverted loot chance: ${round(Inverted_loot_chance, 2)}%`
  invertedLootMultiplier.textContent = `Inverted loot multiplier: ${round(Inverted_loot_multiplier, 2)}`
}, 2000)

const discardLoot = document.getElementById('discard-loot')
const discardLootButton = document.getElementById('discard-loot-button')

boxShopButton.addEventListener('click', () => {
  boxShop.style.visibility = 'visible'
  statsPage.style.visibility = 'hidden'
  discardLoot.style.visibility = 'hidden'
})

statsPageButton.addEventListener('click', () => {
  statsPage.style.visibility = 'visible'
  boxShop.style.visibility = 'hidden'
  discardLoot.style.visibility = 'hidden'
})

discardLootButton.addEventListener('click', () => {
  discardLoot.style.visibility = 'visible'
  statsPage.style.visibility = 'hidden'
  boxShop.style.visibility = 'hidden'
})

// Boxes

let Id = 1
const getId = () => {
  if (Id > 1024) {
    Id = 0
  }
  Id += 1
  return Id
}

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
  box.type = Equipped_box
  box.id = 'BOX' + getId()
  box.src = `assets/${box.type}-opened.png`
  box.classList.add('box-unpacked')
  boxesContainer.appendChild(box)

  createDraggable(box, {
    container: above,
    containerFriction: 1,
    velocityMultiplier: 0,

    onRelease: (self) => {
      if (discardLoot.style.visibility === 'visible' && isInside(box, discardLoot)) {
        if (box.classList.contains('box-packed')) {
          delete Packed_boxes[box.id]
        }
        self.revert()
        removeBox(box)
        return
      }

      if (box.classList.contains('box-packed')) {
        if (!isInside(box, dropoffArea)) {
          return
        }

        const Box_loot = Packed_boxes[box.id]
        self.revert()
        removeBox(box)

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
        delete Packed_boxes[box.id]

        totalCash *= Cash_multi
        totalCash *= Box_types[box.type].Multi
        totalCash *= Actual_cash_multi

        if (inARow >= 3) {
          const plusCash = round(totalCash * inARow / 10 * Cash_multi, 2)
          totalCash = totalCash + plusCash
          notify(`${inARow} ${lastName}s in a row! +${formatCash(plusCash)}`)
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
    box.src = `assets/${box.type}-closed.png`
    Box_placed.enable()
    Box_placed = null
    packBox.disabled = true

    Loot_in_box.forEach(function (loot) {
      removeLoot(loot.element)
      loot.element = null
    })
    Packed_boxes[box.id] = Loot_in_box
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
  { Name: 'labubu', Chance: 1000, Cost: 5 },
  { Name: 'spinner', Chance: 900, Cost: 7 },
  { Name: 'pop-it', Chance: 100, Cost: 10 },
  { Name: 'fidget-cube', Chance: 80, Cost: 12 },
  { Name: 'fidgix-cube', Chance: 50, Cost: 15 },
  { Name: 'needoh', Chance: 50, Cost: 20 },
  { Name: 'pop-it_spinner', Chance: 30, Cost: 30 },
  { Name: 'nuclear-bomb', Chance: 25, Cost: 50 },
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

let Glowing_loot_chance = 0
let Inverted_loot_chance = 0

let Glowing_loot_multiplier = 5
let Inverted_loot_multiplier = 5

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

  if (Glowing_loot_chance >= random(1, 100)) {
    randomLoot.Cost *= Glowing_loot_multiplier
    loot.style.filter += `drop-shadow(0 0 10px #fff)`
  }
  if (Inverted_loot_chance >= random(1, 100)) {
    randomLoot.Cost *= Inverted_loot_multiplier
    loot.style.filter += `invert(100%)`
  }

  const draggable = createDraggable(loot, {
    container: above,
    containerFriction: 1,
    velocityMultiplier: 0,

    onRelease: (self) => {
      if (discardLoot.style.visibility === 'visible' && isInside(loot, discardLoot)) {
        self.revert()
        removeLoot(loot)
        return
      }

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

const Prestige_upgrades_bought = {}

const prestigeMaxed = '#edd2a1'
const prestigePrimary = '#b16f24'
const prestigeSecondary = '#cf9149'

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

const hasReqs = (id, upgs, upgsBought) => {
  const upg = upgs[id]

  let reqsMet = true
  let reason = ''

  upg.Requirements.forEach(function (reqId) {
    if (!reqsMet) {
      return
    }

    if (!upgsBought[reqId]) {
      reqsMet = false
      reason = upgs[reqId].Label
    }
  })

  return [reqsMet, reason]
}

const createCard = (id, isPrestige) => {
  let lsName = 'upgrades'
  let parent = below
  let upgs = Upgrades
  let upgsBought = Upgrades_bought
  let maxedColor = 'rgb(110, 158, 220)'
  let maxedPrimaryColor = primaryBought
  let maxedSecondaryColor = secondaryBought
  if (isPrestige) {
    lsName = 'prestige-upgrades'
    parent = belower
    upgs = Prestige_upgrades
    upgsBought = Prestige_upgrades_bought
    maxedColor = prestigeMaxed
    maxedPrimaryColor = prestigePrimary
    maxedSecondaryColor = prestigeSecondary
  }
  const prefix = isPrestige && '₱' || '$'

  const upg = upgs[id]

  const levels = upg.Levels
  const name = upg.Label

  const card = document.createElement("div");
  card.className = "upgrade-default";
  card.id = name
  card.innerHTML = `
    ${SVG}
    <button></button>
    <p class="amount">${0}/${levels.length}</p>
    <p class="label">${name}</p>
    <p class="price">${prefix}${formatCash(levels[0].Cost)}</p>
  `;
  card.style.transform = `translate(${upg.X}%, ${upg.Y}%)`;
  parent.appendChild(card);

  const button = card.querySelector('button')
  const amount = card.querySelector('.amount')
  const price = card.querySelector('.price')

  button.addEventListener('click', () => {
    let currentLevel = upgsBought[id] || 0

    if (currentLevel >= levels.length) {
      notify('Max level reached')
      return
    }

    const [requirementsMet, whichDoesnt] = hasReqs(id, upgs, upgsBought)
    if (!requirementsMet) {
      notify(`Need ${whichDoesnt}`)
      return
    }

    const levelInfo = levels[currentLevel]
    const Cost = levelInfo.Cost

    if (isPrestige) {
      if (Prestiges < Cost) {
        notify('Not enough prestiges')
        return
      }
    } else {
      if (Cash < Cost) {
        notify('Not enough cash')
        return
      }
    }

    const notSave = levelInfo.Func()
    if (notSave != true) {
      if (isPrestige) {
        addPrestiges(-Cost)
      } else {
        addCash(-Cost)
      }
    }

    currentLevel += 1
    upgsBought[id] = currentLevel
    if (notSave != true) {
      localStorage.setItem(lsName, JSON.stringify(upgsBought))
    }

    if (currentLevel == 1) {
      upg.Lines.forEach(function (path) {
        animate(path, { stroke: { to: maxedPrimaryColor, duration: 550 } })
      })

      const upgsUnlocks = upg.Unlocks
      upgsUnlocks.forEach(function (unlockedId) {
        const [metReqs] = hasReqs(unlockedId, upgs, upgsBought)
        if (metReqs) {
          const svg = upgs[unlockedId].Card.querySelector('svg')
          console.log(svg)
          console.log(maxedPrimaryColor)
          animate(svg, { fill: { to: maxedPrimaryColor, duration: 330 } })
          animate(svg.querySelector('path'), { stroke: { to: maxedSecondaryColor, duration: 390 } })
        }
      })
    }

    amount.textContent = `${currentLevel}/${levels.length}`

    const newPrice = levels[currentLevel] && levels[currentLevel].Cost
    if (newPrice) {
      price.textContent = `${prefix}${formatCash(newPrice)}`
    } else {
      price.textContent = 'Maxed'

      const { chars } = splitText(price, { words: false, chars: true });

      animate(chars, {
        y: [
          { to: '-1.1rem', ease: 'outExpo', duration: 600 },
          { to: 0, ease: 'outBounce', duration: 800, delay: 100 }
        ],
        rotate: { from: '-1turn', delay: 0 },
        color: { to: maxedColor, ease: 'inExpo', duration: 550 },
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

const connect = (a, b, parent = below) => {
  const box = parent.getBoundingClientRect();
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
  parent.querySelector('.lines').appendChild(path);

  return path;
}

// 100 = 128px (one upgrade size)

const Upgrades = {
  'M1': {
    Label: 'Cash multi +0.1x',
    Levels:
      [
        { Cost: 10, Func: () => Cash_multi += 0.1 },
        { Cost: 15, Func: () => Cash_multi += 0.1 },
        { Cost: 20, Func: () => Cash_multi += 0.1 },
        { Cost: 25, Func: () => Cash_multi += 0.1 },
      ],
    X: 0, Y: 0,
    Requirements: []
  },

  'M2': {
    Label: 'Loot luck +0.1',
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
        { Cost: 35, Func: () => Max_loot_per_box += 1 },
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
      { Cost: 70, Func: () => Cash_multi += 0.15 },
      { Cost: 90, Func: () => Cash_multi += 0.15 },
      { Cost: 110, Func: () => Cash_multi += 0.15 },
    ],
    X: 10, Y: 240,
    Requirements: ['M2']
  },

  'M4': {
    Label: 'Unlock box shop',
    Levels: [{
      Cost: 500, Func: () => {
        topRowPicker.style.visibility = 'visible'
        boxShopButton.style.visibility = 'visible'
      }
    }],
    X: 70, Y: 380,
    Requirements: ['L3', 'M3', 'R2']
  },

  'L4': {
    Label: 'Unlock stats page',
    Levels: [{
      Cost: 250, Func: () => {
        topRowPicker.style.visibility = 'visible'
        statsPageButton.style.visibility = 'visible'
      }
    }],
    X: -100, Y: 375,
    Requirements: ['M4']
  },

  'L5': {
    Label: 'Boxes limit +1',
    Levels:
      [
        { Cost: 50, Func: () => Boxes_limit += 1 },
        { Cost: 60, Func: () => Boxes_limit += 1 },
        { Cost: 70, Func: () => Boxes_limit += 1 },
        { Cost: 85, Func: () => Boxes_limit += 1 },
        { Cost: 100, Func: () => Boxes_limit += 1 },
      ],
    X: -135, Y: 500,
    Requirements: ['M4']
  },

  'L6': {
    Label: 'Box space +1',
    Levels:
      [
        { Cost: 100, Func: () => Max_loot_per_box += 1 },
        { Cost: 1000, Func: () => Max_loot_per_box += 1 },
      ],
    X: -170, Y: 650,
    Requirements: ['L5']
  },

  'M5': {
    Label: 'Cash multi +0.25x',
    Levels:
      [
        { Cost: 100, Func: () => Cash_multi += 0.25 },
        { Cost: 200, Func: () => Cash_multi += 0.25 },
        { Cost: 350, Func: () => Cash_multi += 0.25 },
        { Cost: 500, Func: () => Cash_multi += 0.25 },
      ],
    X: 0, Y: 530,
    Requirements: ['M4']
  },

  'M6': {
    Label: 'Cash multi +3x',
    Levels:
      [
        { Cost: 2000, Func: () => Cash_multi += 3 },
        { Cost: 5000, Func: () => Cash_multi += 3 },
      ],
    X: -2, Y: 640,
    Requirements: ['M5']
  },

  'R5': {
    Label: 'Loot luck +0.15',
    Levels:
      [
        { Cost: 250, Func: () => Luck += 0.15 },
        { Cost: 500, Func: () => Luck += 0.15 },
      ],
    X: 150, Y: 540,
    Requirements: ['M4']
  },

  'R6': {
    Label: 'Loot limit +1',
    Levels:
      [
        { Cost: 250, Func: () => Loot_limit += 1 },
        { Cost: 500, Func: () => Loot_limit += 1 },
        { Cost: 750, Func: () => Loot_limit += 1 },
      ],
    X: 155, Y: 650,
    Requirements: ['R5']
  },

  'R7': {
    Label: 'Loot luck +0.3',
    Levels:
      [
        { Cost: 1250, Func: () => Luck += 0.3 },
      ],
    X: 65, Y: 810,
    Requirements: ['R6']
  },

  'R7A': {
    Label: 'Loot discard area',
    Levels: [{
      Cost: 1000, Func: () => {
        topRowPicker.style.visibility = 'visible'
        discardLootButton.style.visibility = 'visible'
      }
    }],
    X: 170, Y: 800,
    Requirements: ['R6']
  },

  'M7': {
    Label: 'Cash multi +5x',
    Levels: [
      { Cost: 100000, Func: () => Cash_multi += 5 },
      { Cost: 150000, Func: () => Cash_multi += 5 },
      { Cost: 200000, Func: () => Cash_multi += 5 },
    ],
    X: -27, Y: 770,
    Requirements: ['M6']
  },

  'L7': {
    Label: 'Glowing loot chance +10%',
    Levels: [
      { Cost: 5, Func: () => Glowing_loot_chance += 10 },
      { Cost: 25, Func: () => Glowing_loot_chance += 10 },
      { Cost: 125, Func: () => Glowing_loot_chance += 10 },
      { Cost: 625, Func: () => Glowing_loot_chance += 10 },
      { Cost: 3125, Func: () => Glowing_loot_chance += 10 },
      { Cost: 15625, Func: () => Glowing_loot_chance += 10 },
      { Cost: 78125, Func: () => Glowing_loot_chance += 10 },
      { Cost: 390625, Func: () => Glowing_loot_chance += 10 },
      { Cost: 1953125, Func: () => Glowing_loot_chance += 10 },
      { Cost: 9765625, Func: () => Glowing_loot_chance += 10 },
    ],
    X: -170, Y: 900,
    Requirements: ['M7', 'R7']
  },

  'L8': {
    Label: 'Glowing loot multi +1x',
    Levels: [
      { Cost: 1_000_000, Func: () => Glowing_loot_multiplier += 1 },
      { Cost: 1_000_000, Func: () => Glowing_loot_multiplier += 1 },
      { Cost: 1_000_000, Func: () => Glowing_loot_multiplier += 1 },
      { Cost: 1_000_000, Func: () => Glowing_loot_multiplier += 1 },
      { Cost: 1_000_000, Func: () => Glowing_loot_multiplier += 1 },
    ],
    X: -170, Y: 1020,
    Requirements: ['L7']
  },

  'M8': {
    Label: 'Inverted loot +10%',
    Levels: [
      { Cost: 5, Func: () => Inverted_loot_chance += 10 },
      { Cost: 50, Func: () => Inverted_loot_chance += 10 },
      { Cost: 500, Func: () => Inverted_loot_chance += 10 },
      { Cost: 5_000, Func: () => Inverted_loot_chance += 10 },
      { Cost: 50_000, Func: () => Inverted_loot_chance += 10 },
      { Cost: 500_000, Func: () => Inverted_loot_chance += 10 },
      { Cost: 5_000_000, Func: () => Inverted_loot_chance += 10 },
      { Cost: 50_000_000, Func: () => Inverted_loot_chance += 10 },
      { Cost: 500_000_000, Func: () => Inverted_loot_chance += 10 },
      { Cost: 5_000_000_000, Func: () => Inverted_loot_chance += 10 },
    ],
    X: -10, Y: 1020,
    Requirements: ['L7', 'L6']
  },

  'R8': {
    Label: 'Inverted multi +5x',
    Levels: [
      { Cost: 10_000_000, Func: () => Inverted_loot_multiplier += 5 },
      { Cost: 50_000_000, Func: () => Inverted_loot_multiplier += 5 },
      { Cost: 150_000_000, Func: () => Inverted_loot_multiplier += 5 },
      { Cost: 350_000_000, Func: () => Inverted_loot_multiplier += 5 },
      { Cost: 1_000_000_000, Func: () => Inverted_loot_multiplier += 5 },
    ],
    X: 160, Y: 1010,
    Requirements: ['M8']
  },

  'R9': {
    Label: 'Loot luck +0.45',
    Levels: [
      { Cost: 50_000_000, Func: () => Luck += 0.45 },
      { Cost: 500_000_000, Func: () => Luck += 0.45 },
    ],
    X: 110, Y: 1150,
    Requirements: ['R7']
  },

  'M9': {
    Label: 'Loot luck +1',
    Levels: [
      { Cost: 1_000_000_000, Func: () => Luck += 1 },
      { Cost: 1_500_000_000, Func: () => Luck += 1 },
    ],
    X: 0, Y: 1150,
    Requirements: ['R9']
  },

  'L9': {
    Label: 'Cash multi +10x',
    Levels: [
      { Cost: 200_000_000, Func: () => Cash_multi += 10 },
      { Cost: 1_000_000_000, Func: () => Cash_multi += 10 },
    ],
    X: -150, Y: 1150,
    Requirements: ['L8']
  },

  'R8A': {
    Label: 'Cash multi +50x',
    Levels: [
      { Cost: 10_000_000, Func: () => Cash_multi += 50 },
      { Cost: 50_000_000, Func: () => Cash_multi += 50 },
    ],
    X: 160, Y: 1010,
    Requirements: ['M8']
  },

  'M10': {
    Label: 'Prestige (Reset)',
    Levels: [
      {
        Cost: 5_000_000_000, Func: () => {
          addPrestiges(1 * Prestiges_multi)
          localStorage.removeItem('cash')
          localStorage.removeItem('upgrades')
          localStorage.removeItem('boxes')
          localStorage.removeItem('equippedBox')
          window.location.reload()
          return true
        }
      }
    ],
    X: 0, Y: 1300,
    Requirements: []
  },
}

const Prestige_upgrades = {
  'L1': {
    Label: '2x cash',
    Levels: [
      { Cost: 1, Func: () => Actual_cash_multi *= 2 },
    ],
    X: -75, Y: 0,
    Requirements: []
  },

  'L2': {
    Label: '2x cash again',
    Levels: [
      { Cost: 2, Func: () => Actual_cash_multi *= 2 },
      { Cost: 4, Func: () => Actual_cash_multi *= 2 },
      { Cost: 8, Func: () => Actual_cash_multi *= 2 },
      { Cost: 16, Func: () => Actual_cash_multi *= 2 },
      { Cost: 32, Func: () => Actual_cash_multi *= 2 },
    ],
    X: -120, Y: 100,
    Requirements: ['L1']
  },

  'R1': {
    Label: '2x prestiges',
    Levels: [
      { Cost: 1, Func: () => Prestiges_multi *= 2 },
    ],
    X: 75, Y: 0,
    Requirements: []
  },

  'R2': {
    Label: '2x prestiges',
    Levels: [
      { Cost: 2, Func: () => Prestiges_multi *= 2 },
      { Cost: 4, Func: () => Prestiges_multi *= 2 },
      { Cost: 8, Func: () => Prestiges_multi *= 2 },
      { Cost: 16, Func: () => Prestiges_multi *= 2 },
      { Cost: 32, Func: () => Prestiges_multi *= 2 },
    ],
    X: 120, Y: 100,
    Requirements: ['R1']
  },

  'M2': {
    Label: '1024x cash',
    Levels: [
      { Cost: 1024, Func: () => Actual_cash_multi *= 1024 },
    ],
    X: 0, Y: 100,
    Requirements: ['L2', 'R2']
  }
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

// Same with prestige upgrades

// add unlocks

for (const id in Prestige_upgrades) {
  Prestige_upgrades[id].Unlocks = []
}

for (const id in Prestige_upgrades) {
  const upg = Prestige_upgrades[id]
  upg.Requirements.forEach(function (reqId) {
    Prestige_upgrades[reqId].Unlocks.push(id)
  })
}

// create cards

for (const id in Prestige_upgrades) {
  const upg = Prestige_upgrades[id]
  upg['Card'] = createCard(id, true)
  upg['Lines'] = []

  if (!upg.Requirements.length) {
    const svg = upg.Card.querySelector('svg')
    svg.style.fill = prestigePrimary
    svg.querySelector('path').style.stroke = prestigeSecondary
  }
}

console.log('main.js loaded')

// testing

const loadUpgrades = (upgs, isPrestige) => {
  const upgsBought = isPrestige && Prestige_upgrades_bought || Upgrades_bought 
  const upgrades = isPrestige && Prestige_upgrades || Upgrades

  const maxedColor = isPrestige && prestigeMaxed || 'rgb(110, 158, 220)'
  const primary = isPrestige && prestigePrimary || primaryBought
  const secondary = isPrestige && prestigeSecondary || secondaryBought
  
  const prefix = isPrestige && '₱' || '$'

  for (const id in upgs) {
    const amountOfLvls = upgs[id]
    const upg = upgrades[id]
    const levels = upg.Levels

    for (let i = 0; i < Math.min(amountOfLvls, levels.length); i++) {
      const currentLevel = i + 1

      levels[i].Func()
      upgsBought[id] = currentLevel

      if (currentLevel == 1) {
        upg.Lines.forEach(function (path) {
          path.style.stroke = primary
        })

        const upgsUnlocks = upg.Unlocks
        upgsUnlocks.forEach(function (unlockedId) {
          const [metReqs] = hasReqs(unlockedId, upgrades, upgsBought)
          if (metReqs) {
            const svg = upgrades[unlockedId].Card.querySelector('svg')
            svg.style.fill = primary
            svg.querySelector('path').style.stroke = secondary
          }
        })
      }

      const amount = upg.Card.querySelector('.amount')
      const price = upg.Card.querySelector('.price')

      amount.textContent = `${currentLevel}/${levels.length}`

      const newPrice = levels[currentLevel] && levels[currentLevel].Cost
      if (newPrice) {
        price.textContent = `${prefix}${formatCash(newPrice)}`
      } else {
        price.textContent = 'Maxed'
        price.style.color = maxedColor
      }
    }
  }
}

const loadBoxes = (boxes) => {
  boxes.forEach(function (type) {
    const card = document.getElementById(type + 'SHOP')
    const button = card.querySelector('button')
    button.textContent = Equipped_box === type && 'Equipped' || 'Equip'
    if (type === 'box') {
      return
    }
    Boxes_owned.push(type)
  })
}

localStorage.getItem('cash') && (addCash(parseFloat(localStorage.getItem('cash'))))
localStorage.getItem('upgrades') && loadUpgrades(JSON.parse(localStorage.getItem('upgrades')))
localStorage.getItem('equippedBox') && (Equipped_box = localStorage.getItem('equippedBox'))
localStorage.getItem('boxes') && loadBoxes(JSON.parse(localStorage.getItem('boxes')))

const prestiges = localStorage.getItem('prestiges')
if (prestiges) { addPrestiges(parseFloat(prestiges)) }

const prestigesUpgs = localStorage.getItem('prestige-upgrades')
if (prestigesUpgs) { loadUpgrades(JSON.parse(prestigesUpgs), true) }

// const mockUpgs = {}

// for (const id in Upgrades) {
//   mockUpgs[id] = 3
// }

// loadUpgrades(mockUpgs)