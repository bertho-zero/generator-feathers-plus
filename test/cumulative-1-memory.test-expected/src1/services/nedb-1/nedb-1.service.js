
// Initializes the `nedb1` service on path `/nedb-1`. (Can be re-generated.)
const createService = require('feathers-memory');
const hooks = require('./nedb-1.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    name: 'nedb-1',
    paginate,
    //!code: options_more //!end
  };

  // Initialize our service with any options it requires
  app.use('/nedb-1', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('nedb-1');

  service.hooks(hooks);
};