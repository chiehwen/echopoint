/**
 * Facebook Users Caching Model
 */

var FacebookModel = {

  Architecture: {
    schema: {
      id: {type: Number, required: true, index: true, unique: true, dropDups: true},
      data: {}
    },

    options: {
      // autoIndex should be false in production (http://mongoosejs.com/docs/guide.html#indexes)
      autoIndex: true
    },
    associations: {
      hasOne: [],
      hasMany: [],
      notNested: {}
    }
  },

  Middleware: {
    // http://mongoosejs.com/docs/middleware.html
    pre: {},
    post: {}
  },

  Custom: {
    // http://mongoosejs.com/docs/guide.html
    methods: {},

    statics: {},

    virtuals: {}
  }
};


module.exports = FacebookModel;