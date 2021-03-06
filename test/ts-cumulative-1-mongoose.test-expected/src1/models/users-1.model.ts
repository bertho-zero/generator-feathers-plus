
// users1-model.ts - A Mongoose model for a user entity
import { App } from '../app.interface';
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
// !<DEFAULT> code: mongoose_schema
import mongooseSchema from '../services/users-1/users-1.mongoose';
// !end
// !code: mongoose_imports // !end
// !code: mongoose_init // !end

let moduleExports = function (app: App) {
  let mongooseClient = app.get('mongooseClient');
  // !code: mongoose_func_init // !end

  // !<DEFAULT> code: mongoose_client
  const users1 = new mongooseClient.Schema(mongooseSchema, { timestamps: true });
  // !end

  let returns = mongooseClient.model('users1', users1);

  // !code: mongoose_func_return // !end
  return returns;
};
// !code: mongoose_more // !end

// !code: mongoose_exports // !end
export default moduleExports;

// !code: mongoose_funcs // !end
// !code: mongoose_end // !end
