import { notify, isInside } from './misc.js'
import { createDraggable } from 'animejs';

console.log('main.js loading')


// Boxes

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

const addBox = (s) => {
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

    document.querySelectorAll('.loot-packed').forEach(function(loot) {
      removeLoot(loot)
    });
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

let Loot_limit = 7
let Loot_count = 0

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

  const loot = document.createElement('img')
  loot.draggable = false
  loot.src = 'assets/loot/labubu.png'
  loot.classList.add('loot-unpacked')
  lootContainer.appendChild(loot)

  createDraggable(loot, {
    container: above,
    containerFriction: 1,
    velocityMultiplier: 0,

    onRelease: (self) => {
      if (Box_placed != null && isInside(loot, boxPlace)) {
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
}

makeLoot.addEventListener('click', () => {
  if (Loot_count < Loot_limit) {
    addLoot()
  } else {
    notify('Loot limit reached')
  }
})

console.log('main.js loaded')