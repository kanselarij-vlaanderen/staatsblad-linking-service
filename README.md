# Staatsblad linking service 

This service monitors for new `LegalResource`'s ("Publications") in [Staatsblad-data](https://github.com/Fedict/lod-sbmb). When a new publication matches with a Kaleidos publication-flow that currently is in progress, the publication-flow can be finalized and linked with the publication. 

## Configuration

### docker-compose snippet

```yaml
  staatsblad-linking:
    image: kanselarij/staatsblad-linking-service:0.2.0
```

### delta-notifier configuration

```js
{
  match: {
    predicate: {
      type: 'uri',
      value: 'http://data.europa.eu/eli/ontology#id_local'
    }
  },
  callback: {
    url: 'http://staatsblad-linking/delta',
    method: 'POST'
  },
  options: {
    resourceFormat: 'v0.0.1',
    gracePeriod: 15000,
    ignoreFromSelf: false
  }
}
```

## API

### POST /delta

Internal endpoint which receives [delta's](https://github.com/mu-semtech/delta-notifier).

### POST /run

Service-endpoint to manually trigger running staatsblad-linking.
