/*
 * Cron-based Analytics Processing
 *
 * Rate limit: There is no explicit limit on the number of tweets in the bulk classification service, but there is timeout window of 60 seconds. That is, if your request takes more than 60 seconds to process, the server will return a 500 error. From past experience, 5000 tweets reliably fit within the 60 second timeout window. 
 * http://help.sentiment140.com/api
 *
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object,
		Harvester = {sentiment140: require('../harvesters/sentiment140')};

var Sentiment140Cron = function() {

	// private functions
	var jobs = {
		populate: function(methods) {		
			Model.Analytics.findOne({'twitter.timeline.tweets': {$exists: true}, 'twitter.timeline.tweets': {$ne: []}, 'twitter.timeline.sentiment.update':  true, 'twitter.timeline.sentiment.timestamp': {$lt : Utils.timestamp() - 600  /* 600 seconds = 10 min */}}, function(err, match) { 
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!match || !match.twitter.timeline.tweets || !match.twitter.timeline.tweets.length)
					return

				Model.User.findOne({'Business.Analytics.id': match._id}, function(err, user) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

					var businessName = false;
					if(!user || !user.Business || !user.Business[0] || !user.Business[0].Analytics || user.Business[0].Analytics != match._id.toString() || !user.Business[0].name)
						businessName = user.Business[0].name;

					// filter out tweets that already have sentiment polarity
					var tweets = []
					for(var i = 0, l = match.twitter.timeline.tweets.length; i < l; i++)
						if(!match.twitter.timeline.tweets[i].sentiment || !match.twitter.timeline.tweets[i].sentiment.polarity)
							tweets.push({text: match.twitter.timeline.tweets[i].data.text, query: businessName ? businessName : '', id: match.twitter.timeline.tweets[i].id_str})
							// query paramater (which specifies what the tweet is about) is set to business name

					// check that tweets needing sentiment were found
					if(!tweets.length) {
						// if no tweets need sentiment then update the database
						match.twitter.timeline.sentiment.update = false;
						match.save(function(err) {
							if(err)
								Log.error('Error saving to Analytics table', {error: err, analytics_id: match._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						})
						return
					}

					// mark the lookup time so this isn't called again for 10 minutes in case of an error (this is to prevent the same user being called repeatedly if something goes wrong)
					match.twitter.timeline.sentiment.timestamp = Utils.timestamp();
					match.save(function(err) {
						if(err)
							Log.error('Error saving to Analytics table', {error: err, analytics_id: match._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					})

					var harvest = new Harvester.sentiment140

					harvest.getMetrics({
						methods: methods,
						tweets: tweets
					}, function(polorizedTweets) {
						console.log('Sentiment140 callback complete [' + methods.toString() + ']')

						if(!polorizedTweets)
							return Log.error('Sentiment140 polorized tweets not returned', {analytics_id: match._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

						// to avoid mongoDB save version errors we call the analytics collection again
						Model.Analytics.findById(match._id, function(err, saveAnalytics) {
							if(err)
								return Log.error('Error querying Analytics collection', {error: err, analytics_id: match._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

							for(var x = 0, l = polorizedTweets.length; x < l; x++)
								for(var y = 0, len = saveAnalytics.twitter.timeline.tweets.length; y < len; y++) {
									if(polorizedTweets[x].id !== saveAnalytics.twitter.timeline.tweets[y].id_str)
										continue;
									saveAnalytics.twitter.timeline.tweets[y].sentiment = {
										polarity: polorizedTweets[x].polarity,
										meta: polorizedTweets[x].meta
									}
								}

							saveAnalytics.twitter.timeline.sentiment.update = false;
							saveAnalytics.markModified('twitter.timeline.tweets');
							saveAnalytics.save(function(err, save) {
								if(err)
									return Log.error('Error saving to Analytics collection', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							})
						})
					})
				})
			})
		}
	}

	// public members
	return {
		getJob: function(type) {
			return jobs[type](arguments[1])
		}
	} // end return object
}

module.exports = Sentiment140Cron;