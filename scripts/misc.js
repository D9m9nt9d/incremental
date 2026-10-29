import { animate, splitText, stagger } from 'animejs';

const notify = (message) => {

  const notification = document.createElement('p')
  notification.classList.add('notification')
  notification.textContent = message

  const { words } = splitText(notification, {
    words: { wrap: 'clip' },
  })

  document.body.append(notification)

  animate(words, {
    y: [
      { to: ['100%', '0%'] },
      { to: '-100%', delay: 750, ease: 'in(3)' }
    ],
    duration: 750,
    ease: 'out(3)',
    delay: stagger(100),
    loop: false,
  });

  setTimeout(() => {
    notification.remove()
  }, 3000);
}

const isInside = (box, place) => {
  const boxRect = box.getBoundingClientRect()
  const placeRect = place.getBoundingClientRect()
  const boxArea = boxRect.width * boxRect.height
  const overlapWidth = Math.max(0, Math.min(boxRect.right, placeRect.right) - Math.max(boxRect.left, placeRect.left))
  const overlapHeight = Math.max(0, Math.min(boxRect.bottom, placeRect.bottom) - Math.max(boxRect.top, placeRect.top))

  return boxArea > 0 && overlapWidth * overlapHeight >= boxArea / 4
}

export { notify, isInside }