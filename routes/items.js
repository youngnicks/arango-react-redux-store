'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Item = require('../models/item');

const items = module.context.collection('items');
const keySchema = joi.string().required()
.description('The key of the item');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.get(function (req, res) {
  res.send(items.all());
}, 'list')
.response([Item], 'A list of items.')
.summary('List all items')
.description(dd`
  Retrieves a list of all items.
`);


router.post(function (req, res) {
  const item = req.body;
  let meta;
  try {
    meta = items.save(item);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(item, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: item._key})
  ));
  res.send(item);
}, 'create')
.body(Item, 'The item to create.')
.response(201, Item, 'The created item.')
.error(HTTP_CONFLICT, 'The item already exists.')
.summary('Create a new item')
.description(dd`
  Creates a new item from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let item
  try {
    item = items.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(item);
}, 'detail')
.pathParam('key', keySchema)
.response(Item, 'The item.')
.summary('Fetch a item')
.description(dd`
  Retrieves a item by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const item = req.body;
  let meta;
  try {
    meta = items.replace(key, item);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(item, meta);
  res.send(item);
}, 'replace')
.pathParam('key', keySchema)
.body(Item, 'The data to replace the item with.')
.response(Item, 'The new item.')
.summary('Replace a item')
.description(dd`
  Replaces an existing item with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let item;
  try {
    items.update(key, patchData);
    item = items.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(item);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the item with.'))
.response(Item, 'The updated item.')
.summary('Update a item')
.description(dd`
  Patches a item with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    items.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a item')
.description(dd`
  Deletes a item from the database.
`);
