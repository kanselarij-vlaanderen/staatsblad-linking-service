import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import {
  sparqlEscapeString, sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeDate,
  uuid as generateUuid
} from 'mu';
import { parseSparqlResults } from './util';

const STAATSBLAD_ELI_DOMAIN = 'http://www.ejustice.just.fgov.be/eli/';
const PUBLICATION_STATUS_MOD_BASE_URI = 'http://themis.vlaanderen.be/id/publicatie-status-wijziging/';

async function selectUnlinkedPublications () {
  const queryString = `PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX pub: <http://mu.semte.ch/vocabularies/ext/publicatie/>

SELECT DISTINCT ?publicationFlow ?numac ?staatsbladDecision
WHERE {
    GRAPH <http://mu.semte.ch/graphs/staatsblad> {
        ?staatsbladDecision a eli:LegalResource ;
            eli:id_local ?numac .
        FILTER(STRSTARTS(STR(?staatsbladDecision), ${sparqlEscapeString(STAATSBLAD_ELI_DOMAIN)}))
    }
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ?publicationFlow a pub:Publicatieaangelegenheid .
        ?publicationFlow pub:identifier / skos:notation ?numac .
        
        ?publicationFlow pub:doorlooptPublicatie ?publicationSubcase .
        
        ?publicationSubcase ^pub:publicatieVindtPlaatsTijdens ?publicationActivity .
    }
    FILTER NOT EXISTS { ?publicationActivity prov:generated ?staatsbladDecision . }
}
`;
  const queryResult = await querySudo(queryString);
  return parseSparqlResults(queryResult);
}

function linkPublication (pubFlow, staatsbladDecision, modificationDate) {
  const pubFlowUri = sparqlEscapeUri(pubFlow);
  const pubStatModUuid = generateUuid();
  const pubStatModUri = sparqlEscapeUri(`${PUBLICATION_STATUS_MOD_BASE_URI}${pubStatModUuid}`);

  const queryString = `PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX pub: <http://mu.semte.ch/vocabularies/ext/publicatie/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

DELETE {
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ${pubFlowUri} adms:status ?publicationStatus .
        ${pubFlowUri} dossier:sluitingsdatum ?pubFlowClosingDate .
        ?ovrbDecision ?ovrbDecisionPred ?ovrbDecisionObj .
    }
}
INSERT {
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ${pubFlowUri} adms:status <http://themis.vlaanderen.be/id/concept/publicatie-status/2f8dc814-bd91-4bcf-a823-baf1cdc42475> ;
            dossier:sluitingsdatum ${sparqlEscapeDate(modificationDate)} .
            prov:hadActivity ${pubStatModUri} .
        ${pubStatModUri} a pub:PublicatieStatusWijziging ;
            mu:uuid ${sparqlEscapeString(pubStatModUuid)} ;
            prov:startedAtTime ${sparqlEscapeDateTime(modificationDate)} .
        ?publicationActivity prov:generated ${sparqlEscapeUri(staatsbladDecision)} .
        ?publicationSubcase dossier:Procedurestap.einddatum ?boundSubcEndDate .
        ?publicationActivity dossier:Activiteit.einddatum ?boundActEndDate .
    }
}
WHERE {
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ${pubFlowUri} a pub:Publicatieaangelegenheid .
        OPTIONAL { ${pubFlowUri} dossier:sluitingsdatum ?pubFlowClosingDate . }

        ${pubFlowUri} pub:doorlooptPublicatie ?publicationSubcase .
        OPTIONAL { ?publicationSubcase dossier:Procedurestap.einddatum ?subcEndDate . }
        BIND(IF(BOUND(?subcEndDate), ?subcEndDate, ${sparqlEscapeDateTime(modificationDate)}) AS ?boundSubcEndDate)

        ?publicationSubcase ^pub:publicatieVindtPlaatsTijdens ?publicationActivity .
        OPTIONAL {
            ?publicationActivity prov:generated ?ovrbDecision .
            FILTER(! STRSTARTS(STR(?ovrbDecision), ${sparqlEscapeString(STAATSBLAD_ELI_DOMAIN)}))
            ?ovrbDecision ?ovrbDecisionPred ?ovrbDecisionObj .
        }
        OPTIONAL { ?publicationActivity dossier:Activiteit.einddatum ?actEndDate . }
        BIND(IF(BOUND(?actEndDate), ?actEndDate, ${sparqlEscapeDateTime(modificationDate)}) AS ?boundActEndDate)
    }
}
`;
  return updateSudo(queryString);
}

export {
  selectUnlinkedPublications,
  linkPublication
};
