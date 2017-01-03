'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Augment = require('../models/augment');

const augments = module.context.collection('augments');
const keySchema = joi.string().required()
.description('The key of the augment');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

const NewAugment = Object.assign({}, Augment, {
  schema: Object.assign({}, Augment.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(augments.all());
}, 'list')
.response([Augment], 'A list of augments.')
.summary('List all augments')
.description(dd`
  Retrieves a list of all augments.
`);


router.post(function (req, res) {
  const augment = req.body;
  let meta;
  try {
    meta = augments.save(augment._from, augment._to, augment);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(augment, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: augment._key})
  ));
  res.send(augment);
}, 'create')
.body(NewAugment, 'The augment to create.')
.response(201, Augment, 'The created augment.')
.error(HTTP_CONFLICT, 'The augment already exists.')
.summary('Create a new augment')
.description(dd`
  Creates a new augment from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let augment
  try {
    augment = augments.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(augment);
}, 'detail')
.pathParam('key', keySchema)
.response(Augment, 'The augment.')
.summary('Fetch a augment')
.description(dd`
  Retrieves a augment by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const augment = req.body;
  let meta;
  try {
    meta = augments.replace(key, augment);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(augment, meta);
  res.send(augment);
}, 'replace')
.pathParam('key', keySchema)
.body(Augment, 'The data to replace the augment with.')
.response(Augment, 'The new augment.')
.summary('Replace a augment')
.description(dd`
  Replaces an existing augment with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let augment;
  try {
    augments.update(key, patchData);
    augment = augments.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(augment);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the augment with.'))
.response(Augment, 'The updated augment.')
.summary('Update a augment')
.description(dd`
  Patches a augment with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    augments.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a augment')
.description(dd`
  Deletes a augment from the database.
`);
