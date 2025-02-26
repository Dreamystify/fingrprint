const { Fingrprint } = require('../lib/index');

const config = {
  clusterNodes: [
    { host: 'redis-cluster-node1', port: 6379 },
    { host: 'redis-cluster-node2', port: 6379 },
    { host: 'redis-cluster-node3', port: 6379 },
  ],
  username: 'default',
  password: 'fingrprint',
  database: 0,
};

setTimeout(async () => {
  console.log('Starting Cluster test 10000ms...');
  console.log('Configuration:', config);

  try {
    console.log('Initializing Fingrprint...');
    const fingrprint = await Fingrprint.initialize(config);

    // Generate a batch of 3 unique IDs.
    const ids = await fingrprint.getIds(3);
    console.log('Generated IDs:', ids);
    console.log('Test Success');

    // Close connection to release resources
    await fingrprint.close();

    process.exit(0);
  } catch (error) {
    console.error('Error connecting to Cluster:', error);
    process.exit(1);
  }
}, 10000); // wait 10 seconds

