'use strict';
const _ = require('lodash');
const db = require('@arangodb').db;
const qb = require('aqb');
const paginate = require('aqb-paginate');
const addApiHeaders = require('foxx-rest-api-headers');
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Request = require('../models/request');

const requests = module.context.collection('requests');
const keySchema = joi.string().required()
.description('The key of the request');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.get(function (req, res) {
  res.send(requests.all());
}, 'list')
.response([Request], 'A list of requests.')
.summary('List all requests')
.description(dd`
  Retrieves a list of all requests.
`);


router.get('/paginated', function (req, res) {
  const totalCount = requests.count();
  const doc = 'request';

  var query = qb.for(doc).in(requests);

  if (req.queryParams.name) {
    query = query.filter(qb.eq(`${doc}.name`, qb.str(req.queryParams.name)));
  }

  query = paginate(query, doc, req.queryParams);
  query = query.return(doc);

  addApiHeaders(req, res, totalCount);

  res.send(db._query(query.toAQL()));
}, 'paginated')
.response([Request], 'A paginated list of requests.')
.summary('Paginated list of all requests')
.description(dd`
  Retrieves a paginated list of all requests.
`);


router.post(function (req, res) {
  const request = req.body;
  let meta;
  try {
    meta = requests.save(request);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(request, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: request._key})
  ));
  res.send(request);
}, 'create')
.body(Request, 'The request to create.')
.response(201, Request, 'The created request.')
.error(HTTP_CONFLICT, 'The request already exists.')
.summary('Create a new request')
.description(dd`
  Creates a new request from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let request
  try {
    request = requests.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(request);
}, 'detail')
.pathParam('key', keySchema)
.response(Request, 'The request.')
.summary('Fetch a request')
.description(dd`
  Retrieves a request by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const request = req.body;
  let meta;
  try {
    meta = requests.replace(key, request);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(request, meta);
  res.send(request);
}, 'replace')
.pathParam('key', keySchema)
.body(Request, 'The data to replace the request with.')
.response(Request, 'The new request.')
.summary('Replace a request')
.description(dd`
  Replaces an existing request with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let request;
  try {
    requests.update(key, patchData);
    request = requests.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(request);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the request with.'))
.response(Request, 'The updated request.')
.summary('Update a request')
.description(dd`
  Patches a request with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    requests.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a request')
.description(dd`
  Deletes a request from the database.
`);
