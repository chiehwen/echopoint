/**
 * Business Model
 */

var BusinessModel = {

  Architecture: {
    schema: {
			id: { type: Number, default: -1},
			name: { type: String},
			meta: {
				created: { type: Date, default: Date.now},
				createdTimestamp: { type: Number, default: Date.now() },
			}   
		},
    options: {
      // autoIndex should be false in production (http://mongoosejs.com/docs/guide.html#indexes)
      autoIndex: true
    },
    associations: {
      belongsTo : ['user'],
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

module.exports = BusinessModel;