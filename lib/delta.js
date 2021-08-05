
function filterDeltaForInsertedPredicates (deltaBody, predicates) {
  const insertionDeltas = deltaBody.map(d => d.inserts).reduce((ds, d) => Array.prototype.concat.apply(ds, d));
  const insertedObjects = insertionDeltas.filter(delta => {
    return predicates.includes(delta.predicate.value);
  }).map(delta => delta.subject.value);
  return insertedObjects;
}

export {
  filterDeltaForInsertedPredicates
};
