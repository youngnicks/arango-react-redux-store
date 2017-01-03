'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const HasItem = require('../models/hasitem');

const hasItemItems = module.context.collection('hasItem');
const keySchema = joi.string().required()
.description('The key of the hasItem');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

const NewHasItem = Object.assign({}, HasItem, {
  schema: Object.assign({}, HasItem.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(hasItemItems.all());
}, 'list')
.response([HasItem], 'A list of hasItemItems.')
.summary('List all hasItemItems')
.description(dd`
  Retrieves a list of all hasItemItems.
`);


router.post(function (req, res) {
  const hasItem = req.body;
  let meta;
  try {
    meta = hasItemItems.save(hasItem._from, hasItem._to, hasItem);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hasItem, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: hasItem._key})
  ));
  res.send(hasItem);
}, 'create')
.body(NewHasItem, 'The hasItem to create.')
.response(201, HasItem, 'The created hasItem.')
.error(HTTP_CONFLICT, 'The hasItem already exists.')
.summary('Create a new hasItem')
.description(dd`
  Creates a new hasItem from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let hasItem
  try {
    hasItem = hasItemItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(hasItem);
}, 'detail')
.pathParam('key', keySchema)
.response(HasItem, 'The hasItem.')
.summary('Fetch a hasItem')
.description(dd`
  Retrieves a hasItem by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const hasItem = req.body;
  let meta;
  try {
    meta = hasItemItems.replace(key, hasItem);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hasItem, meta);
  res.send(hasItem);
}, 'replace')
.pathParam('key', keySchema)
.body(HasItem, 'The data to replace the hasItem with.')
.response(HasItem, 'The new hasItem.')
.summary('Replace a hasItem')
.description(dd`
  Replaces an existing hasItem with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let hasItem;
  try {
    hasItemItems.update(key, patchData);
    hasItem = hasItemItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(hasItem);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the hasItem with.'))
.response(HasItem, 'The updated hasItem.')
.summary('Update a hasItem')
.description(dd`
  Patches a hasItem with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    hasItemItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a hasItem')
.description(dd`
  Deletes a hasItem from the database.
`);
