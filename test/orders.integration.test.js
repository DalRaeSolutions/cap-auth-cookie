const request = require('supertest')
const app = require('express')()
const cds = require('@sap/cds')
const fs = require('fs').promises;
const logLevel = 'error' //'info'
const implementation = require('../srv/serverImplementation');

let files;
let data;

beforeAll(async () => {
  await implementation(app);
  await cds.connect({ kind: 'sqlite', database: ':memory:' })
  const csn = await cds.load('./srv')
  await cds.deploy(csn)
  await cds.serve('all', { logLevel }).in(app)
  files = await fs.readdir('./db/data');
  const fileContent = await Promise.all((files).map(f => fs.readFile(`./db/data/${f}`, 'utf-8')));

  try {
    data = fileContent.reduce((acc, curr, i) => {
      const file = files[i].replace('-', '.').replace('.csv', '');
      const body = curr.split('\n');
      const head = body.shift().split(';');
      acc[file] = {
        head,
        file,
        body: body.map(b => b.split(';'))
      }

      return acc;
    }, {})
  } catch (e) {
    console.log(e)
  }
});

afterAll(async () => {
  await cds.disconnect()
});

describe('OrderService', () => {
  beforeEach(async () => {
    for (let d in data) {
      const f = { ...data[d] };
      try {
        await cds.run(DELETE.from(f.file));
        await cds.run(INSERT.into(f.file).columns(...f.head).rows([...f.body]))
      } catch (e) {
        console.log(f.file, e.message);
      }
    }
  });

  describe('/orders', () => {
    test('returns a list of services', () => {
      return request(app)
        .get('/orders')
        .auth('admin', '')
        .expect('Content-Type', /^application\/json/)
        .expect(200)
        .then(response => {
          expect(response.body.value.length).toEqual(2);
          expect(response.body.value).toContainEqual({ "name": "WorkOrders", "url": "WorkOrders" })
          expect(response.body.value).toContainEqual({ "name": "WorkOrderItems", "url": "WorkOrderItems" })
        })
    });
  })

  describe('/orders/$metadata', () => {
    test('/orders/$metadata is valid and of version 4', () => {
      return request(app)
        .get('/orders/$metadata')
        .auth('admin', '')
        .expect('Content-Type', /xml/)
        .expect(200)
        .then(response => {
          expect(response.text).toMatch(/version="4\.0"/i)
        })
    });
  })

  describe('/orders/WorkOrders', () => {
    test('needs a valid user or it gives a 401', () => {
      return request(app)
        .get('/orders/WorkOrders')
        .expect(401) //Unauthorized
    });

    test('needs a user with an applicable role or it gives a 403', () => {
      return request(app)
        .get('/orders/WorkOrders')
        .auth('noroles', '')
        .expect(403) //Forbidden
    });

    test('takes a user with the `OrderAdmin` role, returns all rows', () => {
      return request(app)
        .get('/orders/WorkOrders')
        .auth('admin', '')
        .expect('Content-Type', /^application\/json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual(
            expect.objectContaining({
              '@odata.context': '$metadata#WorkOrders',
              value: expect.any(Array)
            })
          );

          expect(response.body.value.length).toEqual(6)
        })
    });

    test('takes a user with the `OrderUser` role, returns only relevant rows', () => {
      return request(app)
        .get('/orders/WorkOrders')
        .auth('other', '')
        .expect('Content-Type', /^application\/json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual(
            expect.objectContaining({
              '@odata.context': '$metadata#WorkOrders',
              value: expect.any(Array)
            })
          );

          expect(response.body.value.length).toEqual(3)
        })
    });

    test('has a particular field set', () => {
      const expected = ["ID", "startDate", "endDate", "customer_ID", "description", "createdAt", "createdBy", "modifiedAt", "modifiedBy"]

      return request(app)
        .get('/orders/WorkOrders')
        .auth('other', '')
        .expect('Content-Type', /^application\/json/)
        .expect(200)
        .then(response => {
          expect(expected.sort()).toEqual(Object.keys(response.body.value[0]).sort());
        })
    });
  })
})