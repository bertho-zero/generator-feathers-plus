
// Define the Feathers schema for service `nedb2`. (Can be re-generated.)
// !code: imports // !end
// !code: init // !end

let schema = {
  // !<DEFAULT> code: schema_header
  title: 'Nedb2',
  description: 'Nedb2 database.',
  // !end
  // !code: schema_definitions // !end
  required: [
    // !code: schema_required // !end
  ],
  properties: {
    // !code: schema_properties
    id: { type: 'ID' },
    _id: { type: 'ID' },
    nedb1Id: { type: 'ID' },
    // !end
  },
  // !code: schema_more // !end
};

let extensions = {
  graphql: {
    // !code: graphql_header
    name: 'Nedb2',
    service: {
      sort: { _id: 1 },
    },
    // sql: {
    //   sqlTable: 'Nedb2',
    //   uniqueKey: '__id__',
    //   sqlColumn: {
    //     __authorId__: '__author_id__',
    //   },
    // },
    // !end
    discard: [
      // !code: graphql_discard // !end
    ],
    add: {
      // !code: graphql_add
      nedb1: { type: 'Nedb1!', args: false, relation: { ourTable: 'nedb1Id', otherTable: '_id' } },
      // !end
    },
    // !code: graphql_more // !end
  },
};

// !code: more // !end

let moduleExports = {
  schema,
  extensions,
  // !code: moduleExports // !end
};

// !code: exports // !end
module.exports = moduleExports;

// !code: funcs // !end
// !code: end // !end