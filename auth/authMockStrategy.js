const cds = require('@sap/cds');
const CHALLENGE = 'Basic realm="Users"';

const _getCustomRole = () => new Promise(resolve => setTimeout(() => resolve('Dummy'), 100))

const _getUser = (users, id) => users[id] || users.filter(u => u.ID === id)[0] || { id }

const _getRoles = user => {
  const _roles = ['any', 'identified-user', 'authenticated-user']

  if (user.roles) {
    _roles.push(...user.roles)
  }

  if (user.jwt) {
    const scopes = user.jwt.scope || user.jwt.scopes || []
    const aud = user.jwt.aud || []

    _roles.push(
      ...scopes.map(s => {
        for (const each of aud) {
          s = s.replace(`${each}.`, '')
        }
        return s
      })
    )
  }

  if (user.jwt && (user.jwt.grant_type === 'client_credentials' || user.jwt.grant_type === 'client_x509')) {
    _roles.push('system-user')
  }

  return _roles
}

class MockStrategyAugmented {
  constructor(users, name = 'mock') {
    this.name = name
    this.users = users || cds.env.demo.users || {}
  }

  async authenticate(req) {
    console.log('>> custom auth strategy, cookie present:', req?.session);
    //console.log('Custom mock strategy >>', 'start')
    const authorization = req.headers.authorization
    if (!authorization) return this.fail(CHALLENGE)

    const [scheme, base64] = authorization.split(' ')
    if (!scheme || scheme.toLowerCase() !== 'basic') return this.fail(CHALLENGE)
    if (!base64) return this.fail(400)

    const [id, password] = Buffer.from(base64, 'base64').toString().split(':')

    let user = _getUser(this.users, id);

    if (!user) return this.fail(CHALLENGE)
    if (user.password && user.password !== password) return this.fail(CHALLENGE)

    const _roles = _getRoles(user)

    const attr = Object.assign({}, user.userAttributes, user.jwt && user.jwt.userInfo, user.jwt && user.jwt.attributes)
    const tenant = user.tenant || (user.jwt && user.jwt.zid) || null

    const customRole = await _getCustomRole();
    _roles.push(customRole);

    user = new cds.User({ id: user.ID || id, _roles, attr, tenant });
    // set _req for locale getter
    Object.defineProperty(user, '_req', { enumerable: false, value: req })
    this.success(user)
  }
}

module.exports = MockStrategyAugmented;