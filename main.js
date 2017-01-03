'use strict';

module.context.use('/api/requests', require('./routes/requests'), 'requests');
module.context.use('/api/items', require('./routes/items'), 'items');
module.context.use('/api/augmentedrequests', require('./routes/augmentedrequests'), 'augmentedrequests');
module.context.use('/api/augments', require('./routes/augments'), 'augments');
module.context.use('/api/hasitem', require('./routes/hasitem'), 'hasitem');
