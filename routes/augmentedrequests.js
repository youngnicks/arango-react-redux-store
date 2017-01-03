'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const AugmentedRequest = require('../models/augmentedrequest');

const augmentedRequests = module.context.collection('augmentedRequests');
const keySchema = joi.string().required()
.description('The key of the augmentedRequest');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.get(function (req, res) {
  res.send(augmentedRequests.all());
}, 'list')
.response([AugmentedRequest], 'A list of augmentedRequests.')
.summary('List all augmentedRequests')
.description(dd`
  Retrieves a list of all augmentedRequests.
`);


router.post(function (req, res) {
  const augmentedRequest = req.body;
  let meta;
  try {
    meta = augmentedRequests.save(augmentedRequest);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(augmentedRequest, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: augmentedRequest._key})
  ));
  res.send(augmentedRequest);
}, 'create')
.body(AugmentedRequest, 'The augmentedRequest to create.')
.response(201, AugmentedRequest, 'The created augmentedRequest.')
.error(HTTP_CONFLICT, 'The augmentedRequest already exists.')
.summary('Create a new augmentedRequest')
.description(dd`
  Creates a new augmentedRequest from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let augmentedRequest
  try {
    augmentedRequest = augmentedRequests.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(augmentedRequest);
}, 'detail')
.pathParam('key', keySchema)
.response(AugmentedRequest, 'The augmentedRequest.')
.summary('Fetch a augmentedRequest')
.description(dd`
  Retrieves a augmentedRequest by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const augmentedRequest = req.body;
  let meta;
  try {
    meta = augmentedRequests.replace(key, augmentedRequest);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(augmentedRequest, meta);
  res.send(augmentedRequest);
}, 'replace')
.pathParam('key', keySchema)
.body(AugmentedRequest, 'The data to replace the augmentedRequest with.')
.response(AugmentedRequest, 'The new augmentedRequest.')
.summary('Replace a augmentedRequest')
.description(dd`
  Replaces an existing augmentedRequest with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let augmentedRequest;
  try {
    augmentedRequests.update(key, patchData);
    augmentedRequest = augmentedRequests.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(augmentedRequest);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the augmentedRequest with.'))
.response(AugmentedRequest, 'The updated augmentedRequest.')
.summary('Update a augmentedRequest')
.description(dd`
  Patches a augmentedRequest with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    augmentedRequests.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a augmentedRequest')
.description(dd`
  Deletes a augmentedRequest from the database.
`);
