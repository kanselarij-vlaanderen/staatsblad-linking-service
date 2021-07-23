
function filterDeltaForInsertedType (deltaBody, rdfType) {
  const insertionDeltas = deltaBody.map(d => d.inserts).reduce((ds, d) => Array.prototype.concat.apply(ds, d));
  const insertedObjects = insertionDeltas.filter(delta => {
    return delta.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
      delta.object.value === rdfType;
  }).map(delta => delta.subject.value);
  return insertedObjects;
}

export {
  filterDeltaForInsertedType
};
