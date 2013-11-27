/*
 * Cron-based Analytics Processing
 */
var Auth = require('./auth').getInstance(),
		Log = require('./logger').getInstance().getLogger(),
		Error = require('./error').getInstance(),
		Helper = require('./helpers'),
		Model = Model || Object,
		CronJob = require('cron').CronJob,
		Crons = {
			facebook: require('./crons/facebook').getInstance(),
			twitter: require('./crons/twitter').getInstance(),
			foursquare: require('./crons/foursquare').getInstance(),
			google: require('./crons/google').getInstance(),
			yelp: require('./crons/yelp').getInstance(),
			instagram: require('./crons/instagram').getInstance(),
			klout: require('./crons/klout').getInstance()
		};

var CronJobs = {
	facebook: {
		feed: new CronJob({
			cronTime: '0 */30 * * * *',
			onTick: function() {
				Crons.facebook.getJob('metrics', ['page', 'posts'])
			},
			start: false
		}),

		insights: new CronJob({
			cronTime: '0 30 3 * * *',
			onTick: function() {
				Crons.facebook.getJob('metrics', ['page_insights', 'posts_insights'])
			},
			start: false
		}),

		users: new CronJob({
			cronTime: '45 * * * * *',
			onTick: function() {
				Crons.facebook.getJob('connections', ['connections'])
			},
			start: false
		}) 
	},


	twitter: {
		timeline: new CronJob({
			cronTime: '40 * * * * *',
			onTick: function() {
				Crons.twitter.getJob('metrics', ['credentials', 'timeline', 'mentions', 'retweets', 'dm', 'favorited'])
			},
			start: false
		}),

		connections: new CronJob({
			cronTime: '0 * * * * *', //'0 */15 * * * *',
			onTick: function() {
				Crons.twitter.getJob('metrics', ['retweeters', 'friends', 'followers'])
			},
			start: false
		}),

		users: new CronJob({
			cronTime: '*/5 * * * * *',
			onTick: function() {
				Crons.twitter.getJob('connections', ['populateById', 'populateByScreenName'])
			},

			start: false
		}),

		duplicates: new CronJob({
			cronTime: '*/5 * * * * *',
			onTick: function() {
				Crons.twitter.getJob('connections', ['duplicates'])
			},
			start: false
		}),

		update: new CronJob({
			cronTime: '0 */30 * * * *', 
			onTick: function() {
				Crons.twitter.getJob('connections', ['update'])
			},
			start: false
		})
	},


	foursquare: {
		venue: new CronJob({
			cronTime: '0 */10 * * * *', // every ten minutes for venue metrics
			onTick: function() {
				Crons.foursquare.getJob('metrics', ['venue'])
			},
			start: false
		}),

		stats: new CronJob({
			cronTime: '0 0 4 * * *', // stats every 24 hours 
			onTick: function() {
				Crons.foursquare.getJob('metrics', ['stats'])
			},
			start: false
		}),

		tips: new CronJob({
			cronTime: '0 * * * * *',
			onTick: function() {
				Crons.foursquare.getJob('tips')
			},
			start: false
		}),

		users: new CronJob({
			cronTime: '30 * * * * *',
			onTick: function() {
				Crons.foursquare.getJob('users')
			},

			start: false
		})
	},

	// call together every 5 min (must be called together)
	// every 5 minutes will cover 288 businesses
	// increase call time when app has more businesses!
	google: {
		// run every 5 minutes
		business: new CronJob({
			cronTime: '0 */10 * * * *',
			onTick: function() {
				Crons.google.getJob('metrics', ['business', 'reviews'])
			},

	// THIS IS A SCRAPER, REMOVE MASS USER CALL AND call only one user at a time
	// then call this cron often(every 1- 5 min). otherwise we will call google in a single second for every user
	// also need to add a field of last lookup so we wont crawl again for 24 hours 

			start: false
		}),
		
		// run every 5 minutes
		reviews: new CronJob({
			cronTime: '0 */5 * * * *',
			onTick: function() {
				Crons.google.getJob('reviews', ['reviews'])
			},
			start: false
		})
	},


	// call together every 5 min (must be called together)
	// every 5 minutes will cover 288 businesses
	// increase call time when app has more businesses!
	yelp: new CronJob({
		cronTime: '35 * * * * *',
		onTick: function() {
			Crons.yelp.getJob('metrics', ['business', 'reviews'])
		},
		
// THIS IS A SCRAPER, REMOVE MASS USER CALL AND call only one user at a time
// then call this cron often (every 1- 5 min). otherwise we will call google in one second for every user
// also need to add a field of last lookup so we wont crawl again for 24 hours 

		start: false
	}),

	instagram: {
		users: new CronJob({
			cronTime: '40 * * * * *',
			onTick: function() {
				Crons.instagram.getJob('metrics', ['user'])
			},
			start: false
		})
	},

	klout: new CronJob({
		cronTime: '*/5 * * * * *',
		onTick: function() {
			Crons.klout.getJob('metrics', ['id', 'score', 'update', 'discovery'])
		},
		start: false
	})

} // end cronjobs namespace

module.exports = CronJobs;