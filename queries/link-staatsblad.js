import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString } from 'mu';

const STAATSBLAD_ELI_DOMAIN = 'http://www.ejustice.just.fgov.be/eli/';

function linkStaatsblad (subject, graphs) {
  const queryString = `PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX pub: <http://mu.semte.ch/vocabularies/ext/publicatie/>

DELETE {
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ?publicationFlow adms:status ?publicationStatus .
    }
}
INSERT {
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ?publicationFlow adms:status <http://themis.vlaanderen.be/id/concept/publicatie-status/2f8dc814-bd91-4bcf-a823-baf1cdc42475> .
        ?publicationActivity prov:generated ?decision .
        ?publicationSubcase dossier:Procedurestap.einddatum ?boundSubcEndDate .
        ?publicationActivity dossier:Activiteit.einddatum ?boundActEndDate .
    }
}
WHERE {
    GRAPH <http://mu.semte.ch/graphs/staatsblad> {
        ?decision a eli:LegalResource ;
            eli:id_local ?numac .
    }
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ?publicationFlow a pub:Publicatieaangelegenheid .
        OPTIONAL { ?publicationFlow adms:status ?publicationStatus. }
        ?publicationFlow pub:identifier / skos:notation ?numac .
        
        ?publicationFlow pub:doorlooptPublicatie ?publicationSubcase .
        OPTIONAL { ?publicationSubcase dossier:Procedurestap.einddatum ?subcEndDate . }
        BIND(IF(BOUND(?subcEndDate), ?subcEndDate, NOW()) AS ?boundSubcEndDate)
        
        ?publicationSubcase ^pub:publicatieVindtPlaatsTijdens ?publicationActivity .
        FILTER NOT EXISTS { ?publicationActivity prov:generated ?decision . }
        OPTIONAL { ?publicationActivity dossier:Activiteit.einddatum ?actEndDate . }
        BIND(IF(BOUND(?actEndDate), ?actEndDate, NOW()) AS ?boundActEndDate)
    }
}
`;
  return updateSudo(queryString);
}

function selectUnlinkedPublications () {
  const queryString = `PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX pub: <http://mu.semte.ch/vocabularies/ext/publicatie/>

SELECT ?publicationFlow ?publicationStatus ?numac ?publicationSubcase ?publicationActivity ?staatsbladDecision ?ovrbDecision
WHERE {
    GRAPH <http://mu.semte.ch/graphs/staatsblad> {
        ?staatsbladDecision a eli:LegalResource ;
            eli:id_local ?numac .
        FILTER(STRSTARTS(STR(?staatsbladDecision), ${sparqlEscapeString(STAATSBLAD_ELI_DOMAIN)}))
    }
    GRAPH <http://mu.semte.ch/graphs/organizations/kanselarij> {
        ?publicationFlow a pub:Publicatieaangelegenheid .
        OPTIONAL { ?publicationFlow adms:status ?publicationStatus. }
        ?publicationFlow pub:identifier / skos:notation ?numac .
        
        ?publicationFlow pub:doorlooptPublicatie ?publicationSubcase .
        OPTIONAL { ?publicationSubcase dossier:Procedurestap.einddatum ?subcEndDate . }
        
        ?publicationSubcase ^pub:publicatieVindtPlaatsTijdens ?publicationActivity .
        FILTER NOT EXISTS { ?publicationActivity prov:generated ?staatsbladDecision . }
        OPTIONAL {
            ?publicationActivity prov:generated ?ovrbDecision .
            FILTER(! STRSTARTS(STR(?staatsbladDecision), ${sparqlEscapeString(STAATSBLAD_ELI_DOMAIN)}))
        }
        OPTIONAL { ?publicationActivity dossier:Activiteit.einddatum ?actEndDate . }
    }
}
`;
  return querySudo(queryString);
}

export default {
  linkStaatsblad,
  selectUnlinkedPublications
};
