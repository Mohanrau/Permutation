import pad from 'pad-number'
import permutations from 'permutation'

self.addEventListener('message', handleMessage);

function handleMessage(e) {
  let { operation = 'add', tempNumbers = '[]', mutatedNumbers= '[]', length = 4, cols = 1000, rows = 10, reverseState = false } = e.data
  if (operation === 'add') {
    let numbers = []
    let mutatedNumbers = []

    tempNumbers = JSON.parse(tempNumbers)

   tempNumbers.forEach(async (x) => {
      if (x !== '' && x.length <= length && Number(x) || x === '0000' || x === '000' || x === '00' || x === '0') {
        x = pad(x, length)
        let combinations = permutations(x, {unique: true})
        numbers.push(x)
        mutatedNumbers = [...mutatedNumbers, ...combinations]
      }
    })
    self.postMessage({ numbers: numbers, mutatedNumbers: mutatedNumbers });
  } else {
    let tableData = []
    let availableNumbers = []
    mutatedNumbers = JSON.parse(mutatedNumbers)

    for (let i = 0; i < cols; i++) {
      if ((i - 1) % rows === 0) {
        for (let j = 0; j < 1; j++) {
          let obj = {}
          for (let k = 0; k < 10; k++) {
            let formattedNumber = pad(((i + k) - 1), length)
            if (mutatedNumbers
              && mutatedNumbers.length > 0
              && (!reverseState && mutatedNumbers.includes(formattedNumber))
              || (mutatedNumbers && reverseState && !mutatedNumbers.includes(formattedNumber))
            ) {
              formattedNumber = '-'
            } else {
              availableNumbers.push(formattedNumber)
            }
            obj[k + 1] = formattedNumber
          }
          tableData.push(obj)
        }
      }
    }

    self.postMessage({ items: tableData, availableNumbers: availableNumbers });
  }
}

