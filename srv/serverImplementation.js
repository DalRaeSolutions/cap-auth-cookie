const passport = require('passport');
const auth = require('../auth/authMockStrategy');
const cookie = require('cookie-parser');
const cookieOptions = { expires: new Date(Date.now() + 900000), httpOnly: true, secure: true, signed: true }

module.exports = async (app) => {
  await app.use(cookie('brs-cookie-secret'));

  app.use(async (req, res, next) => {
    if (!req?.signedCookies?.userattributes) {
      console.log('>> cookie not set, fetching data and setting cookie');
      res.cookie('userattributes', JSON.stringify({
        businessEntities: [1, 2, 3]
      }), cookieOptions);
    } else {
      console.log('>> cookie set, all good')
    }

    next();
  });

  await passport.use(new auth());
  await app.use(passport.initialize());
  await app.use(passport.authenticate('mock', { session: false }))
}
