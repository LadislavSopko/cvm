db = db.getSiblingDB('mydatabase');

db.createUser({
  user: 'user',
  pwd: 'password',
  roles: [
    {
      role: 'readWrite',
      db: 'mydatabase'
    }
  ]
});

db.createCollection('items');