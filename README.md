# Federated Tracing with Ariadne

This demo shows how support for federated tracing can be added to Python-based subgraphs using Ariadne as a GraphQL Server.

## Installation & Set-up

Install Node.js dependencies from the project root:

```sh
npm i
```

Then install Python dependencies in a Conda environment:

```sh
conda create -n ariadne-tracing --file requirements.txt
```

Activate the new Conda environment:

```sh
conda activate ariadne-tracing
```

Install Ariadne and Uvicorn:

```sh
pip install ariadne==0.12.0 uvicorn==0.13.3
```

Then start up the Apollo Gateway and the three Ariadne-based implementing services:

```sh
npm start
```

Next, create a new graph in Apollo Studio, add your `APOLLO_KEY` to the `.env` file, and then publish the three services' schemas using the [Rover CLI](https://www.apollographql.com/docs/rover/):

```sh
rover subgraph introspect http://localhost:5001 \
  | rover subgraph publish my-graph-name@current \
  --schema - \
  --name accounts \
  --routing-url http://localhost:5001
```

```sh
rover subgraph introspect http://localhost:5002 \
  | rover subgraph publish my-graph-name@current \
  --schema - \
  --name products \
  --routing-url http://localhost:5002
```

```sh
rover subgraph introspect http://localhost:5003 \
  | rover subgraph publish my-graph-name@current \
  --schema - \
  --name reviews \
  --routing-url http://localhost:5003
```

Lastly, add your `APOLLO_KEY` to the `.env` file and rerun `npm start` to start the gateway in managed federation mode.

## Usage & Rationale

Navigate to GraphQL Playground at [http://localhost:4000/graphql](http://localhost:4000/graphql) and run a few queries to test out sending traces up Apollo Studio. Your federated traces should now be available in Studio 🎉

The `InlineTraceExtension` class is based on Apollo's [ApolloServerPluginInlineTrace](https://github.com/apollographql/apollo-server/blob/b7a91df76acef748488eedcfe998917173cff142/packages/apollo-server-core/src/plugin/inlineTrace/index.ts). Ariadne exposes and extensions API that is very similar to Apollo's own plugins API, so this extension (and the related `TraceTreeBuilder` class) are near line-for-line re-implementations of the Node plugin in Python.

Similar support for federated traces in other GraphQL servers is achievable as long as they similarly expose an API to tap into the execution lifecycle of any operation on a field-by-field basis.

## References

- [Ariadne - Extension system](https://ariadnegraphql.org/docs/0.7.0/extensions)
- [Apollo Docs - Federated traces](https://www.apollographql.com/docs/federation/metrics/)
