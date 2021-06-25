require("dotenv").config();

const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const { ApolloServer } = require("apollo-server");
const {
  ApolloServerPluginUsageReporting,
  ApolloServerPluginUsageReportingDisabled
} = require("apollo-server-core");

const isProd = process.env.NODE_ENV === "production";
const apolloKey = process.env.APOLLO_KEY;
if (!process.env.APOLLO_GRAPH_VARIANT) {
  process.env.APOLLO_GRAPH_VARIANT = "development";
}

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    request.http.headers.set("userid", context.userID);
  }
}

let gatewayOptions = {
  debug: isProd ? false : true,
  buildService({ url }) {
    return new AuthenticatedDataSource({ url });
  }
};

if (!apolloKey) {
  console.log(
    `Head over to https://studio.apollographql.com and create an account to follow walkthrough in the Acephei README`
  );

  gatewayOptions = {
    serviceList: [
      { name: "accounts", url: "http://localhost:5001" },
      { name: "products", url: "http://localhost:5002" },
      { name: "reviews", url: "http://localhost:5003" }
    ],
    debug: isProd ? false : true,
    buildService({ url }) {
      return new AuthenticatedDataSource({ url });
    }
  };
}

const apolloUsageReportingPlugin = apolloKey
  ? ApolloServerPluginUsageReporting({
      sendVariableValues: {
        all: true
      },
      sendHeaders: {
        all: true
      }
    })
  : ApolloServerPluginUsageReportingDisabled();

const gateway = new ApolloGateway(gatewayOptions);
const server = new ApolloServer({
  gateway,
  subscriptions: false, // Must be disabled with the gateway; see above.
  context: ({ req }) => {
    // get the user token from the headers
    const token = req.headers.authorization || "";

    // parse JWT into scope and user identity
    // const userID = getUserId(token);
    const userID = "1";

    // add the user to the context
    return { userID };
  },
  plugins: [apolloUsageReportingPlugin]
});

const port = process.env.PORT || 4000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
