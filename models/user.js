/**
 * User Model
 */

// Module dependencies
var Auth = require('../server/auth').getInstance();
    
var UserModel = {

  Architecture: {
    schema: {
      name: { type: String},
      email: { type: String, required: true, index: { unique: true } },
      password: { type: String, required: true },
      meta: {
        created: { type: Date, default: Date.now},
        createdTimestamp: { type: Number, default: Date.now() },
        guide: { type: Boolean, default: 1}
      }   
    },
    options: {
      // autoIndex should be false in production (http://mongoosejs.com/docs/guide.html#indexes)
      autoIndex: true
    },
    associations: {
      hasOne: [],
      hasMany: ['business'],
      notNested: {}
    }  
  },

  Middleware: {
    // http://mongoosejs.com/docs/middleware.html
    pre: {
      save: function(next) {
        var user = this;

        // only hash the password if it has been modified (or is new)
        if (!user.isModified('password')) return next();

        Auth.encrypt(user.password, function(err, encrypted){
          if (err) return next(err);
          user.password = encrypted;
          next();
        });
      }
    },
    post: {}
  },

  Custom: {
    // http://mongoosejs.com/docs/guide.html
    methods: {
      authenticate: function(unverified, callback) {
        Auth.authenticate(unverified, this.password, function(err, match){
          if (err) callback(err)
          callback(null, match)
        });
      }
    },

    statics: {
      findByName: function(name, callback) {
        this.find({name: new RegExp(name, 'i')}, callback);
      }
    },

    virtuals: {
      
      "name.email": {
        get: function() {
          return this.name + ' (' + this.email + ')';
        },
        set: function(data) {
           this.name = data.name;
          this.email = data.email;
        }
      }
    }
  }
};


module.exports = UserModel;