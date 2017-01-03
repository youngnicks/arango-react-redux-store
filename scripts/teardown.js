'use strict';
const db = require('@arangodb').db;
const collections = [
  "requests",
  "items",
  "augmentedRequests",
  "augments",
  "hasItem"
];

for (const localName of collections) {
  const qualifiedName = module.context.collectionName(localName);
  db._drop(qualifiedName);
}
