/**
 * Social Apps Model
 */

var SocialModel = {

  Architecture: {
    schema: {
			id: { type: Number, default: -1},
      bitly: {
        // note that a facebook id is often the name of the business
        id: {type: String},
        oauthRequestToken: { type: String },
        oauthRequestTokenSecret: { type: String },
        created: { type: Date },
        expires: { type: String }
      },
			facebook: {
        // note that a facebook id is often the name of the business
        id: {type: String},
        oauthRequestToken: { type: String },
        oauthRequestTokenSecret: { type: String },
        created: { type: Date },
        expires: { type: String }
      },
      twitter: {
        // note that a facebook id is often the name of the business
        id: {type: String},
        oauthRequestToken: { type: String },
        oauthRequestTokenSecret: { type: String },
        created: { type: Date },
        expires: { type: String }
      },
      yelp: {
        // note that a facebook id is often the name of the business
        id: {type: String},
        oauthRequestToken: { type: String },
        oauthRequestTokenSecret: { type: String },
        created: { type: Date },
        expires: { type: String }
      },
      foursquare: {
        // note that a facebook id is often the name of the business
        id: {type: String},
        oauthRequestToken: { type: String },
        oauthRequestTokenSecret: { type: String },
        created: { type: Date },
        expires: { type: String }
      },
      pinterest: {
        // note that a facebook id is often the name of the business
        id: {type: String},
        oauthRequestToken: { type: String },
        oauthRequestTokenSecret: { type: String },
        created: { type: Date },
        expires: { type: String }
      },
      instagram: {
        // note that a facebook id is often the name of the business
        id: {type: String},
        oauthRequestToken: { type: String },
        oauthRequestTokenSecret: { type: String },
        created: { type: Date },
        expires: { type: String }
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

module.exports = SocialModel;