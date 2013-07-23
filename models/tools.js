/**
 * Tools Apps Model
 */

var ToolsModel = {

  Architecture: {
    schema: {
			id: { type: Number, default: -1},
      bitly: {
          id: {type: String},
          username: {type: String},
          oauthAccessToken: {type: String},
          expires: {type: Number},
          created: {type: Number}
      },
      rss: {
        // probably make this a child collection
        id: {type: String}
      } 
		},
    options: {
      // autoIndex should be false in production (http://mongoosejs.com/docs/guide.html#indexes)
      autoIndex: true
    },
    associations: {
      belongsTo : ['user']
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

module.exports = ToolsModel;