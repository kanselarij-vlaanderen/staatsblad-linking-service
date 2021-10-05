import bodyParser from 'body-parser';
import debounce from 'debounce';
import { app, errorHandler } from 'mu';
import { filterDeltaForInsertedPredicates } from './lib/delta';
import {
  selectUnlinkedPublications,
  linkPublication
} from './queries/link-staatsblad';

const NUMAC_PREDICATES = [
  'http://data.europa.eu/eli/ontology#id_local',
  'http://www.w3.org/2004/02/skos/core#notation'
];

async function linkStaatsblad () {
  const unlinkedPubs = await selectUnlinkedPublications();
  console.log(`Found ${unlinkedPubs.length} publications which can be linked to a staatsblad publication`);
  const now = new Date();
  for (const pub of unlinkedPubs) {
    console.log(`Linking <${pub.publicationFlow}> (numac ${pub.numac}) to <${pub.staatsbladDecision}> ...`);
    await linkPublication(pub.publicationFlow, pub.staatsbladDecision, now);
  }
}

const debouncedLinkStaatsblad = debounce(linkStaatsblad, 30 * 1000); // In case of delta's generated by batch import, wait until import is done.

app.post('/run', async (req, res) => {
  linkStaatsblad();
});

app.post('/delta', bodyParser.json(), async (req, res) => {
  res.status(202).end();
  const insertedSubjects = filterDeltaForInsertedPredicates(req.body, NUMAC_PREDICATES);
  if (insertedSubjects.length > 0) {
    console.log(`Received ${insertedSubjects.length} matching inserts through delta's. Handling now.`);
    debouncedLinkStaatsblad();
  }
});

app.use(errorHandler);
