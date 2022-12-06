import Dexie from 'dexie';

export const db = new Dexie('permutations');
db.version(2).stores({
  numbers: 'key',
  comparedNumbers: 'key',
  mutatedNumbers: 'key',
  settings: 'key',
});

export const permutations = function*(elements) {
  if (elements.length === 1) {
    yield elements;
  } else {
    let [first, ...rest] = elements;
    for (let perm of permutations(rest)) {
      for (let j = 0; j < elements.length; j++) {
        let start = perm.slice(0, j);
        let rest = perm.slice(j);
        yield [...start, first, ...rest];
      }
    }
  }
}
