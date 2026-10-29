import { notify, isInside } from './misc.js'
import { createDraggable, random } from 'animejs';

console.log('main.js loading')

// let Id = 1
// const getId = () => {
//   if (Id > 1024) {
//     Id = 0
//   }
//   Id += 1
//   return Id
// }

// Boxes

let Boxes_limit = 10
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
    })
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

  const randomLoot = {...Loots[random(0,2,0)]}

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

console.log('main.js loaded')