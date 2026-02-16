import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI,
  database: process.env.MONGODB_DATABASE,
  replicaSet: process.env.MONGODB_REPLICA_SET,
  options: {
    writeConcern: {
      w: 'majority',
      wtimeout: 5000,
    },
    retryWrites: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  pool: {
    min: 2,
    max: 10,
  },
}));
