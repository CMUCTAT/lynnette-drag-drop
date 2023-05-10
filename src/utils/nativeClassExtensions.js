// Array
Object.defineProperty(Array.prototype, 'compact', {
  value() {
    return this.filter(item => item != null)
  }
})

Object.defineProperty(Array.prototype, 'shuffle', {
  value() {
    for (let currentIndex = this.length - 1; currentIndex > 0; currentIndex--) {
      const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
      [this[currentIndex], this[randomIndex]] = [this[randomIndex], this[currentIndex]]
    }
    return this
  }
})

Object.defineProperty(Array.prototype, 'count', {
  value(callbackFn = () => true, initialValue = 0) {
    return this.sum(element => callbackFn(element) ? 1 : 0, initialValue)
  }
})

Object.defineProperty(Array.prototype, 'sum', {
  value(callbackFn = item => item, initialValue = 0) {
    return this.reduce((sum, element) => sum + callbackFn(element), initialValue)
  }
})

Object.defineProperty(Array.prototype, 'min', {
  value(callbackFn = item => item, initialValue = 0) {
    return this.reduce((min, element) => Math.min(min, callbackFn(element)), initialValue)
  }
})

Object.defineProperty(Array.prototype, 'max', {
  value(callbackFn = item => item, initialValue = 0) {
    return this.reduce((max, element) => Math.max(max, callbackFn(element)), initialValue)
  }
})

Object.defineProperty(Array.prototype, 'group', {
  value(callbackFn, thisArg) {
    return this.reduce((result, item, index, array) => {
      const key = callbackFn.call(thisArg, item, index, array)
      key in result ? result[key].push(item) : result[key] = [item]
      return result
    }, {})
  }
})

Object.defineProperty(Array.prototype, 'groupToMap', {
  value(callbackFn, thisArg) {
    return this.reduce((result, item, index, array) => {
      const key = callbackFn.call(thisArg, item, index, array)
      result.has(key) ? result.get(key).push(item) : result.set(key, [item])
      return result
    }, new Map())
  }
})
