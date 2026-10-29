const notify = (message) => {
  console.log(message)
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