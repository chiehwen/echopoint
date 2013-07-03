/**
 * Social Apps Model
 */

var AppModel = {

  Architecture: {
    schema: {
			id: { type: Number, default: -1},
      bitly: {
        oauth: {
          id: {type: String}
        }
      },
			facebook: {
        oauth: {
          // note that a facebook id is often the name of the business
          id: {type: String},
          access_token: {type: String}
        }
      },
      twitter: {
        oauth: {
          consumer_key: {type: String},
          nonce: {type: String},
          signature: {type: String},
          signature_method: {type: String},
          timestamp: {type: Number}
        }
      },
      yelp: {
        oauth: {
          id: {type: String}
        }
      },
      foursquare: {
        oauth: {
          id: {type: String}
        }
      },
      pinterest: {
        id: {type: String}
      },
      instagram: {
        id: {type: String}
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
      belongsTo : ['business']
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

module.exports = AppModel;