# Staatsblad linking service 

This service monitors for new `LegalResource`'s ("Publications") in [Staatsblad-data](https://github.com/Fedict/lod-sbmb). When a new publication matches with a Kaleidos publication-flow that currently is in progress, the publication-flow can be finalized and linked with the publication. 

## Configuration

### docker-compose snippet

```yaml
  staatsblad-linking:
    build: https://github.com/kanselarij-vlaanderen/uuid-generation-service.git
```

### delta-notifier configuration

```js
{
  match: {
    predicate: {
      type: 'uri',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      type: 'uri',
      value: 'http://data.europa.eu/eli/ontology#LegalResource' // Example type.
    }
  },
  callback: {
    url: 'http://staatsblad-linking/delta',
    method: 'POST'
  },
  options: {
    resourceFormat: 'v0.0.1',
    gracePeriod: 250,
    ignoreFromSelf: false
  }
}
```

## API

### POST /delta

Internal endpoint which receives [delta's](https://github.com/mu-semtech/delta-notifier).

### POST /run

Service-endpoint to manually trigger running staatsblad-linking.
