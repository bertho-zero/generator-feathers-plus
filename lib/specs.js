
// Initialize & update app specs store

const _ = require('lodash');
const chalk = require('chalk');
const { join } = require('path');
const { singular } = require('pluralize');
const { writeFileSync } = require('fs');
const specsExpand = require('./specs-expand');
const { refreshCodeFragments, resetForTest: resetFragments } = require('./code-fragments');

let stashedSpecs = {};
let specsPath;
let generator;

const log = false;

module.exports = {
  setPath,
  initSpecs,
  updateSpecs,
  resetForTest
};

function resetForTest () {
  generator = undefined;
  resetFragments();
}

async function setPath (generator1) {
  if (!generator) { // single initialize in case of composeWith
    generator = generator1;
    specsPath = generator.destinationPath('feathers-gen-specs.json');

    // Note that readJSON calls initSpecs regardless if file exists or not.
    stashedSpecs = generator.fs.readJSON(specsPath, initSpecs('app'));
    log && inspector('setPath before', stashedSpecs);
    specsExpand(stashedSpecs);
    log && inspector('setPath after', stashedSpecs);

    // Specs contains 'current' config/default.json as multiple generators may change it
    // and we don't want to keep rereading it.
    stashedSpecs._defaultJson = generator.fs.readJSON(
      generator.destinationPath(join('config', 'default.json')),
      {}
    );

    // Test if test suite is running.
    stashedSpecs._isRunningTests = generator.destinationRoot().substr(0, 5) === '/tmp/';

    // Extract custom code
    await refreshCodeFragments(generator.destinationRoot());
  }

  /*
   'this._specs = setPath(...)' in generator.js returns setPath's 'stashedSpecs' object, which is static.
   Therefore setPath, the initial generator and any generators started by 'composeWith'
   share the same object. They all 'see' any mutations made by the others.
   */
  return stashedSpecs;
}

function initSpecs (what, info) {
  const specsOptions = stashedSpecs.options = stashedSpecs.options || {};
  specsOptions.ver = specsOptions.ver || '1.0.0';
  if (specsOptions.inspectConflicts === undefined) specsOptions.inspectConflicts = false;
  if (specsOptions.semicolons === undefined) specsOptions.semicolons = true;
  specsOptions.freeze = specsOptions.freeze || [];

  let graphql;
  switch (what) {
    case 'all': // fall through
    case 'options':
      break;
    case 'app':
      stashedSpecs.app = stashedSpecs.app || {};
      stashedSpecs.services = stashedSpecs.services || {};
      stashedSpecs.connections = stashedSpecs.connections || undefined; // default must be undefined
      stashedSpecs.authentication = stashedSpecs.authentication || undefined;
      stashedSpecs.middlewares = stashedSpecs.middlewares || undefined;
      break;
    case 'service':
      stashedSpecs.services = stashedSpecs.services || {};
      stashedSpecs.services[info.name] = stashedSpecs.services[info.name] || {
        name: info.name,
        nameSingular: singular(info.name) || info.name,
        subFolder: info.subFolder || '',
        fileName: `${_.kebabCase(info.name)}`,
        adapter: 'nedb',
        path: `/${_.kebabCase(info.name)}`,
        isAuthEntity: false,
        requiresAuth: false,
        graphql: true
      };
      break;
    case 'connection':
      stashedSpecs.connections = stashedSpecs.connections || {};
      break;
    case 'authentication':
      stashedSpecs.authentication = stashedSpecs.authentication || {};
      stashedSpecs.authentication.strategies = stashedSpecs.authentication.strategies || [];
      stashedSpecs.authentication.entity = stashedSpecs.authentication.entity || undefined;
      break;
    case 'graphql':
      graphql = stashedSpecs.graphql = stashedSpecs.graphql || {};
      graphql.path = graphql.path || '/graphql';
      graphql.strategy = graphql.strategy || 'services';
      graphql.sqlInterface = graphql.sqlInterface || (graphql.strategy === 'sql' ? 'sequelize' : null);
      graphql.requiresAuth = graphql.requiresAuth || false;
      break;
    case 'middleware':
      stashedSpecs.middlewares = stashedSpecs.middlewares || {};
      break;
    default:
      throw new Error(`Unexpected what ${what} in initSpecs. (specs)`);
  }

  stashedSpecs._generators = stashedSpecs._generators || [];
  stashedSpecs._generators.push(what);
  log && inspector(`initSpecs ${what}`, stashedSpecs);
  return stashedSpecs;
}

function updateSpecs (what, props, whosCalling) {
  if (!generator) throw new Error('specs#setPath not called before other funcs. (specs)');
  let serviceSpecs, connectionSpecs, graphqlSpecs, middlewaresSpecs, key2; // for no-case-declarations

  let app;
  switch (what) {
    case 'all':
      break;
    case 'options':
      stashedSpecs.options.ts = props.ts;
      stashedSpecs.options.semicolons = props.semicolons;
      stashedSpecs.options.inspectConflicts = props.inspectConflicts;
      break;
    case 'app':
      app = stashedSpecs.app;
      app.name = props.name;
      app.description = props.description;
      app.src = props.src;
      app.packager = props.packager;
      app.providers = props.providers;
      break;
    case 'service':
      // No other service can be the user-entity if this service is it.
      if (props.isAuthEntity) {
        Object.keys(stashedSpecs.services).forEach(name => {
          if (name !== props.name && stashedSpecs.services[name].isAuthEntity) {
            generator.log();
            generator.log('The user-entity has changed.');
            generator.log([
              'You must later run ',
              chalk.yellow.bold('feathers-plus generate service'),
              ' for service ',
              chalk.yellow.bold(name),
            ].join(''));
            generator.log();
          }

          stashedSpecs.services[name].isAuthEntity = name === props.name;
        });
      }

      serviceSpecs = stashedSpecs.services[props.name];
      serviceSpecs.name = props.name;
      serviceSpecs.nameSingular = props.nameSingular;
      serviceSpecs.subFolder = props.subFolder;
      serviceSpecs.fileName = `${_.kebabCase(props.name)}`;
      serviceSpecs.adapter = props.adapter;
      serviceSpecs.path = props.path;
      //serviceSpecs.isAuthEntity = serviceSpecs.isAuthEntity || false;
      serviceSpecs.requiresAuth = props.isAuthEntity || props.requiresAuth;
      serviceSpecs.graphql = props.graphql;
      break;
    case 'connection':
      connectionSpecs = stashedSpecs.connections[props.adapter] = {};
      connectionSpecs.database = props.database;
      connectionSpecs.adapter = props.adapter;
      connectionSpecs.connectionString = props.connectionString;

      log && inspector('updateSpecs connection before', stashedSpecs);
      specsExpand(stashedSpecs);
      log && inspector('updateSpecs connection after', stashedSpecs);
      break;
    case 'authentication':
      stashedSpecs.authentication = stashedSpecs.authentication || {};
      stashedSpecs.authentication.strategies = props.strategies;
      stashedSpecs.authentication.entity = props.entity;
      break;
    case 'graphql':
      graphqlSpecs = stashedSpecs.graphql = stashedSpecs.graphql || {};
      graphqlSpecs.name = 'graphql';
      graphqlSpecs.path = props.path;
      graphqlSpecs.strategy = props.strategy;
      graphqlSpecs.sqlInterface = props.sqlInterface || null;
      graphqlSpecs.requiresAuth = props.requiresAuth;
      break;
    case 'middleware':
      key2 = props.name;
      middlewaresSpecs = stashedSpecs.middlewares[key2] = {};
      middlewaresSpecs.path = props.path;
      middlewaresSpecs.camel = props.camelName;
      middlewaresSpecs.kebab = props.kebabName;
      break;
    default:
      throw new Error(`Unexpected what ${what} in updateSpecs. (specs)`);
  }

  log && inspector(`updateSpecs ${what} from ${whosCalling}`, stashedSpecs);

  // Persisted specs do not contain specs extensions recalculated every generation
  const persistedSpecs = Object.assign({}, stashedSpecs);
  delete persistedSpecs._databases;
  delete persistedSpecs._adapters;
  delete persistedSpecs._dbConfigs;
  delete persistedSpecs._connectionDeps;
  delete persistedSpecs._generators;
  delete persistedSpecs._isRunningTests;
  delete persistedSpecs._defaultJson;

  // Write file explicitly so the user cannot prevent its update using the overwrite message.
  writeFileSync(specsPath, JSON.stringify(persistedSpecs, null, 2));
}

const { inspect } = require('util');
function inspector (desc, obj, depth = 5) {
  console.log(`\n${desc}`);
  console.log(inspect(obj, { depth, colors: true }));
}
